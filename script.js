// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'SUA_URL_DO_SUPABASE_AQUI';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_DO_SUPABASE_AQUI';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function abrirModal() {
    document.getElementById('modalAgendamento').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modalAgendamento').style.display = 'none';
}

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
                // 1. Verifica se a profissional marcou este dia como "Folga"
                const { data: folgaCheck } = await supabaseClient
                    .from('bloqueios')
                    .select('*')
                    .eq('data', data);

                if (folgaCheck && folgaCheck.length > 0) {
                    alert('⚠️ Infelizmente a profissional está de folga nesta data. Escolha outro dia.');
                    return;
                }

                // 2. Trava anti-duplicidade (verifica se o horário já foi reservado)
                const { data: existente, error: erroBusca } = await supabaseClient
                    .from('agendamentos')
                    .select('id')
                    .eq('data', data)
                    .eq('horario', horario);

                if (erroBusca) throw erroBusca;

                if (existente && existente.length > 0) {
                    alert('⚠️ Este horário já foi reservado por outra cliente. Por favor, escolha outro horário.');
                    return;
                }

                // 3. Insere o agendamento no Supabase
                const { data: inserido, error: erroInsercao } = await supabaseClient
                    .from('agendamentos')
                    .insert([{ procedimento, nome, telefone, data, horario, status: 'confirmado' }]);

                if (erroInsercao) throw erroInsercao;

                // 4. Tela de confirmação limpa para a cliente
                const modalContent = document.querySelector('.modal-content');
                modalContent.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 50px; margin-bottom: 10px;">✅</div>
                        <h3 style="color: #2c3e50; font-family: serif; font-size: 22px;">Agendamento Confirmado!</h3>
                        <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                            Obrigada, <strong>${nome}</strong>! Seu horário para <strong>${procedimento}</strong> foi reservado com sucesso.
                        </p>
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: inline-block; text-align: left;">
                            <p style="margin: 4px 0; color: #444;">📅 <strong>Data:</strong> ${data.split('-').reverse().join('/')}</p>
                            <p style="margin: 4px 0; color: #444;">⏰ <strong>Horário:</strong> ${horario}</p>
                        </div>
                        <br>
                        <button onclick="window.location.reload()" style="background: #6b8e23; color: white; border: none; padding: 10px 20px; border-radius: 20px; font-size: 14px; cursor: pointer; font-weight: bold;">Fazer Novo Agendamento</button>
                    </div>
                `;

            } catch (err) {
                console.error(err);
                alert('Erro ao realizar agendamento: ' + err.message);
            }
        });
    }
});
   
