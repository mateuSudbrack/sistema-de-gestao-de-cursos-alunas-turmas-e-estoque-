const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'https://sistema-de-gestao-de-cursos-alunas-three.vercel.app',
    credentials: true
}));

// --- CONFIGURAÇÃO ---
const PORT = process.env.PORT || 3003;
const EVOLUTION_API_URL = 'https://wppconnect.digiyou.com.br';
const EVOLUTION_API_KEY = 'BQYHJGJHJ';
const INSTANCE_NAME = 'teste';

// Configuração do Banco de Dados Postgres
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || '', 
    port: process.env.DB_PORT || 5432,
});

pool.connect((err) => {
    if (err) console.error('❌ Erro de conexão Postgres:', err.stack);
    else console.log(`✅ Conectado ao PostgreSQL em ${process.env.DB_HOST || 'localhost'}`);
});

// --- HELPER: Buscar Foto na Evolution ---
async function fetchProfilePicture(remoteJid) {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !INSTANCE_NAME) return null;
    try {
        const url = `${EVOLUTION_API_URL}/chat/fetchProfilePictureUrl/${INSTANCE_NAME}`;
        const payload = { number: remoteJid };
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY }
        });
        return response.data?.profilePictureUrl || null;
    } catch (error) {
        console.error(`⚠️ Erro foto perfil: ${error.message}`);
        return null;
    }
}

// Helper to validate UUID format
const isValidUUID = (uuid) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuid && regex.test(uuid);
};

// --- ROTA DE SINCRONIZAÇÃO TOTAL (Ao abrir o App) ---
app.get('/sync', async (req, res) => {
    try {
        // 1. Busca Alunos
        const studentsRes = await pool.query('SELECT * FROM students ORDER BY "updatedAt" DESC');
        
        // 2. Busca Dados Globais (Cursos, Estoque, etc)
        const globalRes = await pool.query("SELECT data FROM app_settings WHERE key = 'GLOBAL_STATE'");
        const globalData = globalRes.rows.length > 0 ? globalRes.rows[0].data : {};

        res.json({
            students: studentsRes.rows,
            global: globalData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao sincronizar dados' });
    }
});

// --- SALVAR DADOS GLOBAIS (Cursos, Produtos, Configs) ---
app.post('/sync/global', async (req, res) => {
    const data = req.body;
    try {
        await pool.query(
            `INSERT INTO app_settings (key, data, "updatedAt") 
             VALUES ('GLOBAL_STATE', $1, NOW())
             ON CONFLICT (key) DO UPDATE SET data = $1, "updatedAt" = NOW()`,
            [data]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar estado global' });
    }
});

// --- CRUD ALUNOS (Individual) ---
app.post('/students', async (req, res) => {
    const client = await pool.connect();
    try {
        const s = req.body;
        const phone = s.phone.replace(/\D/g, '');
        
        const query = `
            INSERT INTO students (
                id, name, phone, email, photo, type, status, 
                "pipelineId", "stageId", "interestedIn", history, 
                "lastContact", "nextFollowUp", "lastPurchase", notes, "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                photo = COALESCE(EXCLUDED.photo, students.photo),
                type = EXCLUDED.type,
                status = EXCLUDED.status,
                "pipelineId" = EXCLUDED."pipelineId",
                "stageId" = EXCLUDED."stageId",
                "interestedIn" = EXCLUDED."interestedIn",
                history = EXCLUDED.history,
                "lastContact" = EXCLUDED."lastContact",
                "nextFollowUp" = EXCLUDED."nextFollowUp",
                "lastPurchase" = EXCLUDED."lastPurchase",
                notes = EXCLUDED.notes,
                "updatedAt" = NOW()
            RETURNING *;
        `;
        
        const values = [
            isValidUUID(s.id) ? s.id : uuidv4(),
            s.name,
            phone,
            s.email || null,
            s.photo || null,
            s.type || 'lead',
            s.status || 'Interessado',
            isValidUUID(s.pipelineId) ? s.pipelineId : null,
            isValidUUID(s.stageId) ? s.stageId : null,
            s.interestedIn || [],
            JSON.stringify(s.history || []),
            s.lastContact ? s.lastContact : null,
            s.nextFollowUp ? s.nextFollowUp : null,
            s.lastPurchase ? s.lastPurchase : null,
            s.notes || ''
        ];

        const result = await client.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('---!!!! ERRO DETALHADO NA ROTA /students !!!!---');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Request Body (s):', req.body);
        console.error('Erro Completo:', err);
        console.error('---!!!! FIM DO ERRO DETALHADO !!!!---');
        res.status(500).json({
            error: 'Erro interno ao processar a requisição.',
            details: err.message,
            code: err.code || 'UNKNOWN'
        });
    } finally {
        client.release();
    }
});

app.delete('/students/:id', async (req, res) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
        return res.status(400).json({ error: 'ID do estudante inválido.' });
    }

    const client = await pool.connect();
    try {
        const deleteQuery = 'DELETE FROM students WHERE id = $1 RETURNING *;';
        const result = await client.query(deleteQuery, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Estudante não encontrado.' });
        }

        res.json({ success: true, message: 'Estudante apagado com sucesso.', deletedStudent: result.rows[0] });
    } catch (err) {
        console.error('---!!!! ERRO AO APAGAR ESTUDANTE !!!!---');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Student ID:', id);
        console.error('Erro Completo:', err);
        console.error('---!!!! FIM DO ERRO !!!!---');
        res.status(500).json({
            error: 'Erro interno ao apagar o estudante.',
            details: err.message,
            code: err.code || 'UNKNOWN'
        });
    } finally {
        client.release();
    }
});

// --- WEBHOOK EVOLUTION ---
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;
        
        // Verifica evento
        if (body.event !== 'messages.upsert') return res.status(200).send('Ignored');
        
        const msgData = body.data;
        // Ignora mensagens enviadas por mim ou sem dados
        if (!msgData || !msgData.key || msgData.key.fromMe) return res.status(200).send('Ignored');

        const remoteJid = msgData.key.remoteJid; 
        const pushName = msgData.pushName || 'Desconhecido';
        const phone = remoteJid.replace(/\D/g, '');

        console.log(`📩 Webhook de: ${pushName} (${phone})`);

        // 1. Busca Foto de Perfil na API
        const photoUrl = await fetchProfilePicture(remoteJid);

        // 2. Atualiza ou Cria no Banco
        const checkRes = await pool.query('SELECT id, photo FROM students WHERE phone = $1', [phone]);
        
        if (checkRes.rows.length > 0) {
            // Atualiza contato existente
            await pool.query(
                'UPDATE students SET photo = COALESCE($1, photo), "lastContact" = NOW(), "updatedAt" = NOW() WHERE id = $2',
                [photoUrl, checkRes.rows[0].id]
            );
        } else {
            // Cria novo Lead
            const newId = uuidv4();
            const today = new Date().toISOString().split('T')[0];
            await pool.query(
                `INSERT INTO students (id, name, phone, photo, type, status, "pipelineId", history, "lastContact", notes) 
                 VALUES ($1, $2, $3, $4, 'lead', 'Interessado', 'default-system-pipeline', '[]', $5, 'Webhook WhatsApp')`,
                [newId, pushName, phone, photoUrl, today]
            );
        }
        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('❌ Erro webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API rodando na porta ${PORT}`);
});
