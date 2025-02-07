// ==UserScript==
// @name         VWO CSV Resume
// @namespace    http://tampermonkey.net/
// @version      2025-01-29
// @description  try to take over the world!
// @author       You
// @match        https://app.vwo.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=vwo.com
// @grant        none
// ==/UserScript==

(function () {

  // Função para processar CSV em string e calcular PBB para múltiplas variantes
  function analyzeABTest(csvString) {
    // Converter CSV para matriz de dados
    const rows = csvString.trim().split("\n").map(row => row.split(";").map(cell => cell.trim()));

    // Extrair cabeçalhos e métricas
    const headers = rows[0].slice(1); // Excluir primeira coluna ("Métricas")
    const metrics = rows.slice(1).map(row => ({
      metric: row[0],
      values: row.slice(1).map(val => parseInt(val, 10)) // Converter valores para números inteiros
    }));

    // Identificar usuários do controle e variações
    const userRow = metrics.find(row => row.metric === "Usuários");
    const usersControl = userRow.values[0]; // Primeira coluna = Controle
    const variantUsers = userRow.values.slice(1); // Restante são as variações

    // Função para calcular a CDF da normal (sem bibliotecas externas)
    function normalCDF(x, mean, std) {
      const t = 1 / (1 + 0.2316419 * Math.abs((x - mean) / std));
      const d = 0.3989423 * Math.exp(-((x - mean) / std) * ((x - mean) / (2 * std * std)));
      const probability =
        d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return x > mean ? 1 - probability : probability;
    }

    // Função para calcular Probability to be Better
    function probabilityToBeBetter(controlConversions, variantConversions, usersControl, usersVariant) {
      const pControl = (controlConversions + 1) / (usersControl + 2);
      const pVariant = (variantConversions + 1) / (usersVariant + 2);

      const seControl = Math.sqrt((pControl * (1 - pControl)) / usersControl);
      const seVariant = Math.sqrt((pVariant * (1 - pVariant)) / usersVariant);

      const seDifference = Math.sqrt((seControl * seControl) + (seVariant * seVariant));
      const zScore = (pVariant - pControl) / seDifference;

      return normalCDF(zScore, 0, 1);
    }

    // Calcular PBB para cada métrica e variação
    const results = [];
    for (let row of metrics) {
      if (row.metric === "Usuários") continue; // Pular linha de usuários

      const controlConversions = row.values[0]; // Primeiro valor = Controle
      const variants = row.values.slice(1); // Restante são variações

      // Calcular PBB para cada variação em relação ao Controle
      const variantResults = variants.map((variantConversions, i) => ({
        variant: headers[i + 1], // Nome da variação
        probabilityToBeBetter: `${(probabilityToBeBetter(controlConversions, variantConversions, usersControl, variantUsers[i]) * 100).toFixed(2)}%`
      }));

      results.push({ metric: row.metric, comparisons: variantResults });
    }

    // Adicionar colunas de probabilidade ao CSV
    const updatedCSV = rows.map((row, index) => {
      if (index === 0) {
        // Adicionar cabeçalhos das novas colunas
        return [...row, ...headers.slice(1).map(header => `PTB (${header})`)].join(";");
      } else if (row[0] === "Usuários") {
        // Manter a linha de usuários inalterada
        return row.join(";");
      } else {
        // Adicionar as probabilidades correspondentes à métrica
        const metricResult = results.find(result => result.metric === row[0]);
        const probabilities = metricResult.comparisons.map(comp => comp.probabilityToBeBetter);
        return [...row, ...probabilities].join(";");
      }
    }).join("\n");

    // Retornar o CSV atualizado
    return updatedCSV;
  }
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function getMetricsResume() {
    const allMetrics = document.querySelectorAll('[data-qa="yemiletunu"] li') || [];
    const metricResume = [];

    for (const metric of allMetrics) {
      metric.click();
      await sleep(2000);

      const variations = document.querySelectorAll('tbody tr.ng-scope:not(.table-total-row)[vwo-rearrange-children="getTableColumnsOrder()"]') || [];

      if (variations.length) {
        const variationResume = [];

        for (const variation of variations) {
          const metricName = document.querySelector('[data-qa="tovaxivumi"]').innerText;
          const variantName = variation.querySelector('[data-qa="dogabiziye"]').innerText;
          const numeros = variation.querySelector('[data-qa="zodofocaxu"]').innerText.split('/');
          variationResume.push([metricName, variantName, ...numeros]);
        }

        metricResume.push(variationResume);
      }
    }

    return metricResume;
  }


  async function copyCSVToClipboard(data) {
    const csvContent = data.map(row => row.join(';').replaceAll(',', '')).join('\n');
    const csvData = analyzeABTest(csvContent);
    await navigator.clipboard.writeText(csvData)
  }


  const button = document.createElement('button');
  button.innerText = 'Gerar e Copiar CSV';
  button.style.position = 'fixed';
  button.style.top = '40px';
  button.style.right = '10px';
  button.style.zIndex = '1000';
  document.body.appendChild(button);


  const buttonDiasExperimento = document.createElement('button');
  buttonDiasExperimento.innerText = 'Dias experimento';
  buttonDiasExperimento.style.position = 'fixed';
  buttonDiasExperimento.style.top = '80px';
  buttonDiasExperimento.style.right = '10px';
  buttonDiasExperimento.style.zIndex = '1000';
  document.body.appendChild(buttonDiasExperimento);
  buttonDiasExperimento.addEventListener('click', async () => {
    alert(`Dias de experimento: ${document.querySelectorAll('[class="angular-date-range-picker__calendar-day angular-date-range-picker__calendar-day-selected"]').length}`);
  });




  button.addEventListener('click', async () => {
    button.innerText = 'Coletando dados...';
    button.disabled = true;

    try {
      const myResumeVWO = await getMetricsResume();
      const outputObjectResumo = [
        ['Métricas', ...myResumeVWO[0].map((x) => x[1])],
        ['Usuários', ...myResumeVWO[0].map((x) => x[3])],
      ];

      for (index in myResumeVWO) {
        outputObjectResumo.push([myResumeVWO[index][0][0], ...myResumeVWO[index].map((x) => x[2])]);
      }

      await copyCSVToClipboard(outputObjectResumo);
      button.innerText = 'Copiado!';
      setTimeout(() => {
        button.innerText = 'Gerar e Copiar CSV';
        button.disabled = false;
      }, 500);
    } catch (error) {
      console.error('Erro ao processar métricas:', error);
      button.innerText = 'Erro! Tente novamente';
      setTimeout(() => {
        button.innerText = 'Gerar e Copiar CSV';
        button.disabled = false;
      }, 3000);
    }
  });
})();
