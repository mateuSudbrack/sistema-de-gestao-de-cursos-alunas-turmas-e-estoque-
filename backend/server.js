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

const SAFE2PAY_API_KEY = 'CB561ADF5245481FA4B866E28445514E';
const SAFE2PAY_BASE_URL = 'https://payment.safe2pay.com.br/v2';

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
    else {
        console.log(`✅ Conectado ao PostgreSQL em ${process.env.DB_HOST || 'localhost'}`);
        // Criar tabela de pagamentos se não existir
        pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY,
                "linkId" TEXT,
                "studentId" TEXT,
                "courseId" TEXT,
                amount DECIMAL(10,2),
                method VARCHAR(50),
                status VARCHAR(50),
                "safe2payId" VARCHAR(255),
                "customerData" JSONB,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            -- Garantir que colunas antigas sejam TEXT se ja existiam como UUID
            ALTER TABLE payments ALTER COLUMN "linkId" TYPE TEXT;
            ALTER TABLE payments ALTER COLUMN "courseId" TYPE TEXT;
            ALTER TABLE payments ALTER COLUMN "studentId" TYPE TEXT;
        `).catch(e => console.log('Info: Tabela de pagamentos verificada.'));
    }
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

// Helper para disparar automações via Evolution
async function triggerAutomation(trigger, student) {
    try {
        const globalRes = await pool.query("SELECT data FROM app_settings WHERE key = 'GLOBAL_STATE'");
        if (globalRes.rows.length === 0) return;
        const data = globalRes.rows[0].data;
        
        const config = data.evolutionConfig;
        if (!config || !config.apiUrl || !config.apiKey || !config.instanceName) return;

        const rules = data.automations?.rules?.filter(r => r.active && r.trigger === trigger);
        if (!rules || rules.length === 0) return;

        for (const rule of rules) {
            const rawText = rule.message;
            const formattedText = rawText
              .replace('{nome}', student.name.split(' ')[0])
              .replace('{nome_completo}', student.name)
              .replace('{telefone}', student.phone);
            
            const url = `${config.apiUrl}/message/sendText/${config.instanceName}`;
            await axios.post(url, {
                number: student.phone,
                text: formattedText
            }, {
                headers: { 'Content-Type': 'application/json', 'apikey': config.apiKey }
            });
            console.log(`✅ Automação "${rule.name}" executada para ${student.name}`);
        }
    } catch (e) {
        console.error("❌ Erro ao disparar automação:", e.message);
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

// --- ROTA DE CRIAÇÃO DE PAGAMENTO (Safe2Pay) ---
app.post('/payments/create', async (req, res) => {
    try {
        const { link, customer, method } = req.body;

        if (!customer.cpf || !customer.name || !customer.phone) {
            return res.status(400).json({ error: 'Dados do cliente incompletos (Nome, CPF e Telefone são obrigatórios).' });
        }

        // Tenta determinar a URL base para o webhook
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['host'];
        const webhookUrl = `${protocol}://${host}/payments/webhook`;

        const payload = {
            IsSandbox: false,
            Application: 'Sistema de Gestão de Cursos',
            Vendor: 'Estética Pro',
            CallbackUrl: webhookUrl,
            Customer: {
                Name: customer.name,
                Identity: customer.cpf.replace(/\D/g, ''),
                Phone: customer.phone.replace(/\D/g, ''),
                Email: customer.email || 'contato@esteticapro.com',
                Address: {
                    ZipCode: '01310100', // CEP Genérico válido (Paulista, SP)
                    Street: 'Avenida Paulista',
                    Number: '1000',
                    District: 'Bela Vista',
                    CityName: 'São Paulo',
                    StateInitials: 'SP',
                    CountryName: 'Brasil'
                }
            },
            Products: [
                {
                    Code: link.id.substring(0, 10),
                    Description: link.title,
                    UnitPrice: link.amount,
                    Quantity: 1
                }
            ],
            PaymentMethod: method === 'pix' ? '6' : '2' // 6=Pix, 2=Cartão de Crédito
        };

        if (method === 'credit') {
            const expiry = customer.cardExpiry.replace(/\D/g, ''); // Espera MMAAAA
            payload.CreditCard = {
                Holder: customer.cardHolder,
                CardNumber: customer.cardNumber.replace(/\D/g, ''),
                ExpirationDate: expiry.length === 4 ? `${expiry.substring(0,2)}/20${expiry.substring(2,4)}` : (expiry.length === 6 ? `${expiry.substring(0,2)}/${expiry.substring(2,6)}` : expiry),
                SecurityCode: customer.cardCVC,
                InstallmentQuantity: 1
            };
        }

        console.log(`🚀 Enviando pagamento Safe2Pay (${method}):`, JSON.stringify(payload, null, 2));

        const response = await axios.post(`${SAFE2PAY_BASE_URL}/Payment`, payload, {
            headers: { 'X-API-KEY': SAFE2PAY_API_KEY }
        });

        const s2pData = response.data;
        console.log('✅ Resposta Safe2Pay:', JSON.stringify(s2pData, null, 2));

        if (s2pData.HasError) {
            console.error('❌ Erro na API Safe2Pay:', s2pData.Error);
            return res.status(400).json({ error: s2pData.Error });
        }

        // Salvar no banco
        const paymentId = uuidv4();

        await pool.query(
            `INSERT INTO payments (id, "linkId", "courseId", amount, method, status, "safe2payId", "customerData")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                paymentId, 
                link.id.toString(), 
                link.courseId ? link.courseId.toString() : null, 
                link.amount, 
                method, 
                'pending', 
                s2pData.ResponseDetail.IdTransaction.toString(), 
                JSON.stringify({ ...customer, linkId: link.id, courseId: link.courseId })
            ]
        );

        res.json({
            success: true,
            transactionId: s2pData.ResponseDetail.IdTransaction,
            pix: s2pData.ResponseDetail.QrCode,
            pixKey: s2pData.ResponseDetail.Key,
            status: s2pData.ResponseDetail.Status
        });

    } catch (error) {
        const errorDetail = error.response?.data || error.message;
        console.error('❌ Erro Crítico Safe2Pay:', errorDetail);
        res.status(500).json({ 
            error: 'Erro ao processar pagamento com Safe2Pay',
            details: typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail
        });
    }
});

// --- WEBHOOK SAFE2PAY ---
app.post('/payments/webhook', async (req, res) => {
    try {
        const body = req.body;
        console.log('🔔 Webhook Safe2Pay:', JSON.stringify(body, null, 2));

        // Safe2Pay pode enviar de formas diferentes dependendo da versão/config
        const transactionId = body.IdTransaction || (body.Transaction && body.Transaction.Id);
        const statusCode = body.TransactionStatus ? body.TransactionStatus.Code : (body.Status !== undefined ? body.Status : null);

        // Status 3 geralmente é "Pago" / "Success"
        if (statusCode == 3 || statusCode == '3' || body.Status === 'Success' || (body.TransactionStatus && body.TransactionStatus.Code == 3)) {
            if (!transactionId) {
                console.error('❌ Webhook recebido sem IdTransaction');
                return res.status(400).send('No Transaction ID');
            }

            // 1. Buscar pagamento no banco
            const payRes = await pool.query('SELECT * FROM payments WHERE "safe2payId" = $1', [transactionId.toString()]);
            if (payRes.rows.length === 0) {
                console.warn(`⚠️ Pagamento ${transactionId} não encontrado no banco local.`);
                return res.status(404).send('Payment not found');
            }

            const payment = payRes.rows[0];
            if (payment.status === 'paid') return res.send('Already processed');

            // 2. Atualizar status do pagamento
            await pool.query('UPDATE payments SET status = \'paid\', "updatedAt" = NOW() WHERE id = $1', [payment.id]);

            // 3. Buscar ou criar aluno
            const customer = payment.customerData;
            const phone = customer.phone.replace(/\D/g, '');
            const courseId = payment.courseId || customer.courseId;
            
            let student;
            const studentRes = await pool.query('SELECT * FROM students WHERE phone = $1', [phone]);
            
            if (studentRes.rows.length > 0) {
                student = studentRes.rows[0];
            } else {
                const newId = uuidv4();
                const insertRes = await pool.query(
                    `INSERT INTO students (id, name, phone, email, type, status, history, notes)
                     VALUES ($1, $2, $3, $4, 'student', 'Ativo', '[]', 'Criado via Safe2Pay')
                     RETURNING *`,
                    [newId, customer.name, phone, customer.email]
                );
                student = insertRes.rows[0];
            }

            // 4. Se houver curso vinculado, matricular
            let history = Array.isArray(student.history) ? student.history : [];
            if (courseId) {
                const globalRes = await pool.query("SELECT data FROM app_settings WHERE key = 'GLOBAL_STATE'");
                if (globalRes.rows.length > 0) {
                    const globalData = globalRes.rows[0].data;
                    const classes = globalData.classes || [];
                    const openClass = classes
                        .filter(c => c.courseId === courseId && c.status === 'open')
                        .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
                    
                    if (openClass) {
                        if (!openClass.enrolledStudentIds.includes(student.id)) {
                            openClass.enrolledStudentIds.push(student.id);
                            globalData.classes = classes;
                            await pool.query(
                                "UPDATE app_settings SET data = $1 WHERE key = 'GLOBAL_STATE'",
                                [globalData]
                            );
                        }

                        history.push({
                            courseId: courseId,
                            classId: openClass.id,
                            date: new Date().toISOString().split('T')[0],
                            paid: parseFloat(payment.amount),
                            status: 'paid'
                        });
                    }
                }
            } else {
                history.push({
                    date: new Date().toISOString().split('T')[0],
                    paid: parseFloat(payment.amount),
                    status: 'paid',
                    notes: 'Pagamento via link'
                });
            }

            // 5. Atualizar aluno
            await pool.query(
                'UPDATE students SET type = \'student\', status = \'Ativo\', history = $1, "lastPurchase" = NOW(), "updatedAt" = NOW() WHERE id = $2',
                [JSON.stringify(history), student.id]
            );

            // 6. Disparar automações
            await triggerAutomation('payment_confirmed', student);
            if (courseId) await triggerAutomation('enrollment_created', student);

            console.log(`✅ Pagamento ${transactionId} processado com sucesso para ${student.name}`);
        } else {
            console.log(`ℹ️ Webhook recebido com status irrelevante: ${statusCode}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Erro no webhook Safe2Pay:', error);
        res.status(500).json({ error: error.message });
    }
});

            // 5. Atualizar aluno
            await pool.query(
                'UPDATE students SET type = \'student\', status = \'Ativo\', history = $1, "lastPurchase" = NOW(), "updatedAt" = NOW() WHERE id = $2',
                [JSON.stringify(history), student.id]
            );

            // 6. Disparar automações
            await triggerAutomation('payment_confirmed', student);
            if (payment.courseId) await triggerAutomation('enrollment_created', student);

            console.log(`✅ Pagamento processado para ${student.name}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Erro no webhook Safe2Pay:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API rodando na porta ${PORT}`);
});
