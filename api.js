async function getData() {
    // Valida os campos antes de continuar
    if (!validateForm()) {
        return; // Se a validação falhar, interrompe a execução
    }

    let ra = document.getElementById('ra').value;
    let senha = document.getElementById('senha').value;

    try {
        let t = ""; // O token deve ser obtido da autenticação ou da API
        let e = ""; // ID da tarefa que você quer completar automaticamente

        // Fazendo requisição para obter dados da questão
        const questionData = await getQuestionData(t, e);
        const filteredQuestions = filterQuestions(questionData);

        // Requisições para resolver os tipos de questões
        let answersTrueFalse = await getAnswerTrueFalse(filteredQuestions, t, e);
        let answersCloud = await getAnswerCloud(filteredQuestions, t, e);
        let answersSingle = await getAnswerSingle(filteredQuestions, t, e);
        let answersMulti = await getAnswerMulti(filteredQuestions, t, e);

        // Combina todas as respostas
        const allAnswers = { ...answersTrueFalse, ...answersCloud, ...answersSingle, ...answersMulti };
        console.log(allAnswers);
        alert("Atividades concluídas com sucesso!");

    } catch (error) {
        console.error("Erro ao completar atividades:", error);
        alert("Erro ao completar atividades.");
    }
}

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
