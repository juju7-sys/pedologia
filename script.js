// ==========================================
// CONFIGURAÇÃO DO SUPABASE (Ajuste se necessário)
// ==========================================
const SUPABASE_URL = 'SUA_URL_DO_SUPABASE_AQUI';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_DO_SUPABASE_AQUI';

// Inicializa o cliente do Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', function() {
    const formAgendamento = document.getElementById('formAgendamento');
    
    if (formAgendamento) {
        formAgendamento.addEventListener('submit', async function(e) {
            e.preventDefault();

            const procedimento = document.getElementById('procedimento').value;
            const nome = document.getElementById('nome').value;
            const telefone = document.getElementById('telefone').value;
            const data = document.getElementById('data').value;
            const horario = document.getElementById('horario').value;

            if (!procedimento || !nome || !telefone || !data || !horario) {
                alert('Por favor, preencha todos os campos!');
                return;
            }

            try {
                // 1. Verifica se já existe agendamento para essa data e horário (Anti-duplicidade)
                const { data: existente, error: erroBusca } = await supabaseClient
                    .from('agendamentos')
                    .id('id')
                    .eq('data', data)
                    .eq('horario', horario);

                if (erroBusca) throw erroBusca;

                if (existente && existente.length > 0) {
                    alert('⚠️ Este horário já foi reservado por outra cliente. Por favor, escolha outro horário ou dia.');
                    return;
                }

                // 2. Insere o novo agendamento no Supabase
                const { data: inserido, error: erroInsercao } = await supabaseClient
                    .from('agendamentos')
                    .insert([
                        { procedimento, nome, telefone, data, horario, status: 'confirmado' }
                    ]);

                if (erroInsercao) throw erroInsercao;

                // 3. Exibe a tela de confirmação limpa para a cliente
                const containerPrincipal = formAgendamento.closest('section') || formAgendamento.parentElement;
                containerPrincipal.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 500px; margin: 0 auto;">
                        <div style="font-size: 50px; margin-bottom: 15px;">✅</div>
                        <h3 style="color: #2c3e50; margin-bottom: 15px; font-family: serif; font-size: 24px;">Agendamento Confirmado!</h3>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                            Obrigada, <strong>${nome}</strong>! Seu horário para <strong>${procedimento}</strong> foi reservado com sucesso.
                        </p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px; display: inline-block; text-align: left;">
                            <p style="margin: 5px 0; color: #444;">📅 <strong>Data:</strong> ${data.split('-').reverse().join('/')}</p>
                            <p style="margin: 5px 0; color: #444;">⏰ <strong>Horário:</strong> ${horario}</p>
                        </div>
                        <br>
                        <button onclick="window.location.reload()" style="background: #6b8e23; color: white; border: none; padding: 12px 25px; border-radius: 25px; font-size: 15px; cursor: pointer; font-weight: bold;">Fazer Novo Agendamento</button>
                    </div>
                `;

            } catch (err) {
                console.error(err);
                alert('Erro ao realizar agendamento: ' + err.message);
            }
        });
    }
});

