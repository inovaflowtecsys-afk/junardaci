// backend/routes/profissionais.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SERVICE_ROLE_KEY = 'sua-service-role-key-secreta'; // NUNCA expor no frontend!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

router.post('/cadastrar-profissional', async (req, res) => {
  const { nome, email, senha, ...outrosDados } = req.body;

  // 1. Cria usuário no Auth
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (userError || !userData?.user?.id) {
    return res.status(400).json({ error: userError?.message || 'Erro ao criar usuário no Auth.' });
  }

  const userId = userData.user.id;

  // 2. Insere profissional na tabela, vinculando pelo UID
  const { data: profData, error: profError } = await supabase
    .from('profissionais')
    .insert([{ nome, email, user_id: userId, ...outrosDados }])
    .select('id')
    .single();

  if (profError) {
    return res.status(400).json({ error: profError.message });
  }

  return res.json({ profissional: profData, auth_uid: userId });
});

module.exports = router;
