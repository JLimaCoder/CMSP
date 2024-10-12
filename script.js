// Função principal para realizar todas as atividades de todas as tarefas
async function getData() {
    // Valida os campos antes de continuar
    if (!validateForm()) {
        return; // Se a validação falhar, interrompe a execução
    }

    let ra = document.getElementById('ra').value;
    let senha = document.getElementById('senha').value;

    try {
        let token = await authenticate(ra, senha); // Autentica e obtém o token
        
        // Obtém todas as tarefas disponíveis
        const tasks = await getAllTasks(token);

        // Para cada tarefa, processa as questões
        for (let task of tasks) {
            let taskId = task.id; // ID da tarefa atual

            // Fazendo requisição para obter os dados da questão da tarefa
            const questionData = await getQuestionData(token, taskId);
            const filteredQuestions = filterQuestions(questionData);

            // Resolve as questões de acordo com o tipo
            let answersTrueFalse = await getAnswerTrueFalse(filteredQuestions, token, taskId);
            let answersCloud = await getAnswerCloud(filteredQuestions, token, taskId);
            let answersSingle = await getAnswerSingle(filteredQuestions, token, taskId);
            let answersMulti = await getAnswerMulti(filteredQuestions, token, taskId);

            // Combina todas as respostas
            const allAnswers = { ...answersTrueFalse, ...answersCloud, ...answersSingle, ...answersMulti };
            console.log(`Respostas para tarefa ${taskId}:`, allAnswers);

            // Notificação para cada tarefa
            createAndShowNotification(`Tarefa ${taskId} concluída com sucesso!`);
        }
        
        createAndShowNotification("Todas as atividades foram concluídas com sucesso!");
    } catch (error) {
        console.error("Erro ao completar atividades:", error);
        createAndShowNotification("Erro ao completar atividades.");
    }
}

// Função para autenticar e obter o token
async function authenticate(ra, senha) {
    const response = await fetch('URL_DE_AUTENTICACAO', { // Insira a URL correta
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ra, senha })
    });

    if (!response.ok) {
        throw new Error("Falha na autenticação");
    }

    const data = await response.json();
    return data.token; // Retorne o token recebido
}

// Função para obter todas as tarefas
async function getAllTasks(token) {
    const response = await fetch('https://edusp-api.ip.tv/tms/task', { // URL para obter todas as tarefas
        headers: {
            "accept": "application/json, text/plain, */*",
            "x-api-key": token,
        },
        mode: "cors"
    });

    if (!response.ok) {
        throw new Error("Erro ao obter as tarefas");
    }

    const data = await response.json();
    return data.tasks; // Retorna todas as tarefas disponíveis
}

// Função para obter os dados da questão
async function getQuestionData(token, taskId) {
    const response = await fetch(`https://edusp-api.ip.tv/tms/task/${taskId}/apply?preview_mode=false`, {
        headers: {
            "accept": "application/json, text/plain, */*",
            "x-api-key": token,
        },
        mode: "cors"
    });
    const data = await response.json();
    return data.questions.filter(question => question.type !== "info");
}

// Função para filtrar questões por tipo
function filterQuestions(questions) {
    const questionTypes = { "true-false": [], "single": [], "multi": [], "cloud": [] };
    questions.forEach(question => {
        questionTypes[question.type].push({
            id: question.id,
            options: question.options,
            statement: question.statement
        });
    });
    return questionTypes;
}

// Função para resolver questões do tipo "verdadeiro ou falso"
async function getAnswerTrueFalse(questions, token, taskId) {
    let answers = {};
    for (let question of questions["true-false"]) {
        const response = await fetch(`https://edusp-api.ip.tv/tms/task/${taskId}/question/${question.id}/correct`, {
            method: "POST",
            headers: {
                "x-api-key": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ answer: { answer: { "0": true } } })
        });
        const result = await response.json();
        answers[question.id] = result.comment;
    }
    return answers;
}

// Função para resolver questões do tipo "nuvem de palavras"
async function getAnswerCloud(questions, token, taskId) {
    let answers = {};
    for (let question of questions.cloud) {
        const response = await fetch(`https://edusp-api.ip.tv/tms/task/${taskId}/question/${question.id}/correct`, {
            method: "POST",
            headers: {
                "x-api-key": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ answer: { answer: ["palavra"] } }) // Palavra para responder
        });
        const result = await response.json();
        answers[question.id] = result.comment;
    }
    return answers;
}

// Função para resolver questões de escolha única
async function getAnswerSingle(questions, token, taskId) {
    let answers = {};
    for (let question of questions.single) {
        const response = await fetch(`https://edusp-api.ip.tv/tms/task/${taskId}/question/${question.id}/correct`, {
            method: "POST",
            headers: {
                "x-api-key": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ answer: { "0": true } })
        });
        const result = await response.json();
        answers[question.id] = result.comment;
    }
    return answers;
}

// Função para resolver questões de múltipla escolha
async function getAnswerMulti(questions, token, taskId) {
    let answers = {};
    for (let question of questions.multi) {
        const response = await fetch(`https://edusp-api.ip.tv/tms/task/${taskId}/question/${question.id}/correct`, {
            method: "POST",
            headers: {
                "x-api-key": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ answer: { "0": true, "1": true } })
        });
        const result = await response.json();
        answers[question.id] = result.comment;
    }
    return answers;
}

// Função para validar o formulário
function validateForm() {
    const ra = document.getElementById('ra').value;
    const senha = document.getElementById('senha').value;
    if (ra === "" || senha === "") {
        createAndShowNotification("Por favor, preencha todos os campos.");
        return false; // Formulário inválido
    }
    return true; // Formulário válido
}

// Função para criar e exibir notificações
function createAndShowNotification(message) {
    return new Promise((resolve) => {
        let notificationCount = document.querySelectorAll('.notification').length + 1;
        const notification = document.createElement("div");
        notification.id = `notification-${notificationCount}`;
        notification.className = "notification";
        notification.innerHTML = `
            <div class="notification-content">
                <span class="close-btn" onclick="closeNotification(${notificationCount})">&times;</span>
                <p>${message}</p>
                <div class="progress-bar"><div></div></div>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.getElementById(`notification-${notificationCount}`).style.right = "20px";
        }, 10);

        setTimeout(() => {
            closeNotification(notificationCount);
            resolve();
        }, 5000);
    });
}

// Função para fechar notificações
function closeNotification(notificationId) {
    const notification = document.getElementById(`notification-${notificationId}`);
    notification.style.right = "-320px";
    setTimeout(() => {
        notification.remove();
    }, 500);
}
