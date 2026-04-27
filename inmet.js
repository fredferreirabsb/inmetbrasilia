const https = require('https');

exports.handler = async function(event, context) {
  // Suporta CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  const params = event.queryStringParameters || {};
  const codigo = params.codigo;
  const data   = params.data;

  if (!codigo || !data) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ erro: 'Parâmetros ausentes: codigo e data' }),
    };
  }

  const url = `https://apitempo.inmet.gov.br/estacao/${data}/${data}/${codigo}`;

  try {
    const dados = await new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; INMETMonitor/1.0)',
          'Accept': 'application/json',
          'Referer': 'https://tempo.inmet.gov.br/',
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch(e) {
            reject(new Error(`JSON inválido (status ${res.statusCode}): ${body.slice(0, 300)}`));
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify(dados.data),
    };

  } catch(err) {
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ erro: err.message }),
    };
  }
};
