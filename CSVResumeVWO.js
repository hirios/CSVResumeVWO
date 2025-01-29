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

(function() {
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
        const csvContent = data.map(row => row.join(';')).join('\n');
        await navigator.clipboard.writeText(csvContent)
    }


    const button = document.createElement('button');
    button.innerText = 'Gerar e Copiar CSV';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '1000';
    document.body.appendChild(button);

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
