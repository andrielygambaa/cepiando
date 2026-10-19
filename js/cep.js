// ---------- Elementos da página ----------
const campoCep = document.getElementById('cep');
const botaoBuscar = document.getElementById('btn-buscar');
const mensagem = document.getElementById('mensagem');

const campos = {
  rua: document.getElementById('rua'),
  bairro: document.getElementById('bairro'),
  cidade: document.getElementById('cidade'),
  uf: document.getElementById('uf'),
};

// ---------- Funções auxiliares ----------
function mostrarMensagem(texto, tipo = '') {
  mensagem.textContent = texto;
  mensagem.className = tipo; // 'erro', 'sucesso' ou 'carregando'
}

function limparEndereco() {
  Object.values(campos).forEach((campo) => {
    campo.value = '';
    campo.classList.remove('preenchido');
  });
}

// Converte o erro técnico em uma mensagem que o usuário entende
function mensagemAmigavel(erro) {
  if (erro.message === 'CEP_INVALIDO') {
    return 'CEP inválido. Digite os 8 números, por exemplo 01310-100.';
  }
  if (erro.message === 'CEP_NAO_ENCONTRADO') {
    return 'Não encontramos esse CEP. Confira os números e tente de novo.';
  }
  if (erro instanceof TypeError) {
    // fetch() lança TypeError quando não há conexão com a internet
    return 'Sem conexão com o serviço de CEP. Verifique sua internet e tente novamente.';
  }
  return 'Não foi possível buscar o CEP agora. Tente novamente em instantes.';
}

// ---------- Função principal: fetch + JSON + DOM ----------
async function buscarCEP(cep) {
  const cepLimpo = cep.replace(/\D/g, ''); // deixa só os números
  limparEndereco();

  try {
    if (cepLimpo.length !== 8) throw new Error('CEP_INVALIDO');

    mostrarMensagem('Buscando endereço…', 'carregando');
    botaoBuscar.disabled = true;

    // 1. Requisição
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!resposta.ok) throw new Error(`HTTP_${resposta.status}`);

    // 2. Converte o corpo da resposta em objeto JavaScript
    const dados = await resposta.json();

    // O ViaCEP responde 200 OK com { "erro": true } quando o CEP não existe
    if (dados.erro) throw new Error('CEP_NAO_ENCONTRADO');

    // 3. Atualiza o DOM (sem recarregar a página)
    campos.rua.value = dados.logradouro;
    campos.bairro.value = dados.bairro;
    campos.cidade.value = dados.localidade;
    campos.uf.value = dados.uf;
    Object.values(campos).forEach((c) => c.classList.add('preenchido'));

    mostrarMensagem('Endereço encontrado! Agora é só informar o número.', 'sucesso');
    document.getElementById('numero').focus();
  } catch (erro) {
    console.error('Erro na busca de CEP:', erro);
    mostrarMensagem(mensagemAmigavel(erro), 'erro');
  } finally {
    botaoBuscar.disabled = false;
  }
}

// ---------- Eventos ----------
// Máscara 00000-000 e busca automática quando o CEP estiver completo
campoCep.addEventListener('input', () => {
  let numeros = campoCep.value.replace(/\D/g, '').slice(0, 8);
  if (numeros.length > 5) numeros = `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
  campoCep.value = numeros;

  if (numeros.length === 9) buscarCEP(numeros);
});

botaoBuscar.addEventListener('click', () => buscarCEP(campoCep.value));

campoCep.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') {
    evento.preventDefault();
    buscarCEP(campoCep.value);
  }
});

document.getElementById('form-cadastro').addEventListener('submit', (e) => e.preventDefault());
