// Credenciais oficiais do Supabase
const SUPABASE_URL = 'https://uxwudralertyohnwcgj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ADjn65Fdf72YQIU4ivP0sQ_HG8Yw...'; // Insira a chave completa se necessário

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let dataSelecionada = '2026-11-18'; // Data padrão inicial
let horarioSelecionado = '';

// Horários-padrão de atendimento do dia
const horariosFixos = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];

function abrirModal() {
    document.getElementById('modalAgendamento').classList.add('active');
    carregarHorariosOcupados();
}

function fecharModal() {
    document.getElementById('modalAgendamento').classList.remove('active');
}

function mudarData(elemento, novaData) {
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    elemento.classList.add('selected');
    dataSelecionada = novaData;
    horarioSelecionado = '';
    carregarHorariosOcupados(); // Consulta o Supabase para ver o que já está ocupado nesta data
}

// Função fundamental para verificar no Supabase os horários já reservados
async function carregarHorariosOcupados() {
    const containerHorarios = document.getElementById('gradeHorarios');
    containerHorarios.innerHTML = '<p style="grid-column: span 3; text-align: center; font-size: 12px; color: #6b7c73;">Verificando vagas disponíveis...</p>';

    // Busca no Supabase todos os agendamentos salvos para a data escolhida
    const { data: agendamentos, error } = await supabaseClient
        .from('agendamentos')
        .select('data_hora')
        .ilike('data_hora', `${dataSelecionada}%`);

    let horariosOcupados = [];
    if (!error && agendamentos) {
        // Extrai apenas o horário (ex: "14:30") das datas cadastradas no banco
        horariosOcupados = agendamentos.map(item => {
            return item.data_hora.split(' ')[1].substring(0, 5);
        });
    }

    // Monta os botões na tela bloqueando os que já foram pegos
    containerHorarios.innerHTML = '';
    horariosFixos.forEach(horario => {
        const div = document.createElement('div');
        div.classList.add('time-slot');
        div.textContent = horario;

        if (horariosOcupados.includes(horario)) {
            // Se já foi reservado por alguém, fica desativado e tachado
            div.classList.add('ocupado');
            div.title = 'Este horário já foi reservado';
        } else {
            div.onclick = function() {
                document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
                div.classList.add('selected');
                horarioSelecionado = horario;
            };
        }
        containerHorarios.appendChild(div);
    });
}

function selecionarHorario(elemento, horario) {
    document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
    elemento.classList.add('selected');
    horarioSelecionado = horario;
}

// Envio do formulário para salvar a vaga no Supabase com segurança
const form = document.getElementById('formAgendamentoSupabase');
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const procedimento = document.getElementById('procedimento').value;
        const nome = document.getElementById('nomeCliente').value;
        const telefone = document.getElementById('whatsappCliente').value;

        if (!horarioSelecionado) {
            alert('Por favor, selecione um horário disponível.');
            return;
        }

        const dataHoraCompleta = `${dataSelecionada} ${horarioSelecionado}:00`;

        const btn = document.getElementById('btnConfirmar');
        btn.textContent = 'Salvando agendamento...';
        btn.disabled = true;

        // Dupla checagem antes de salvar para evitar conflito caso alguém pegue o horário no mesmo segundo
        const { data: checagem } = await supabaseClient
            .from('agendamentos')
            .select('*')
            .eq('data_hora', dataHoraCompleta);

        if (checagem && checagem.length > 0) {
            alert('Ops! Este horário acabou de ser reservado por outra pessoa. Por favor, escolha outro.');
            btn.textContent = 'Confirmar agendamento';
            btn.disabled = false;
            carregarHorariosOcupados();
            return;
        }

        // Salva na tabela do Supabase
        const { error } = await supabaseClient
            .from('agendamentos')
            .insert([
                { 
                    nome: nome, 
                    telefone: telefone, 
                    data_hora: dataHoraCompleta 
                }
            ]);

        if (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao realizar agendamento: ' + error.message);
            btn.textContent = 'Confirmar agendamento';
            btn.disabled = false;
        } else {
            alert('Agendamento realizado com sucesso! Sua vaga está garantida.');
            form.reset();
            fecharModal();
            btn.textContent = 'Confirmar agendamento';
            btn.disabled = false;
            horarioSelecionado = '';
        }
    });
}
