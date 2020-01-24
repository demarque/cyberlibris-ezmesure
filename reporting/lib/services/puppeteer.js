const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const formatDate = require('date-fns/format');
const { fr } = require('date-fns/locale');
const { elasticsearch, kibana, puppeteerTimeout } = require('config');
const { getDashboard, buildDashboardUrl } = require('./dashboard');
const Frequency = require('./frequency');

const fsp = { readFile: promisify(fs.readFile) };


const getAssets = async () => {
  const logo = await fsp.readFile(path.resolve('assets', 'logo.png'), 'base64');
  const preserveLayoutCSS = await fsp.readFile(path.resolve('assets', 'css', 'preserve_layout.css'), 'utf8');
  const printCSS = await fsp.readFile(path.resolve('assets', 'css', 'print.css'), 'utf8');

  if (logo && preserveLayoutCSS && printCSS) {
    return {
      logo,
      preserveLayoutCSS,
      printCSS,
    };
  }

  return null;
};

module.exports = async (dashboardId, space, frequencyString, print) => {
  const frequency = new Frequency(frequencyString);

  if (!frequency.isValid()) {
    throw new Error('invalid task frequency');
  }

  const now = new Date();
  const period = {
    from: frequency.startOfPreviousPeriod(now),
    to: frequency.startOfCurrentPeriod(now),
  };

  const { dashboard } = (await getDashboard(dashboardId, space)) || {};
  const dashboardUrl = buildDashboardUrl(dashboardId, space, period);
  const dashboardTitle = dashboard && dashboard.title;

  const css = await getAssets();

  const fields = {
    username: 'input[name=username]',
    password: 'input[name=password]',
  };

  const viewport = {
    width: 1920,
    a4: {
      width: 1096, // 29cm
      height: 793, // 21cm
    },
    margin: {
      left: 50,
      right: 50,
      top: 100,
      bottom: 60,
    },
  };

  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    headless: true,
    slowMo: 10,
    ignoreDefaultArgs: ['--enable-automation'],
    defaultViewport: null,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', // Absolute trust of the open content in chromium
    ],
  });
  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(puppeteerTimeout);
  page.setDefaultTimeout(puppeteerTimeout);

  await page.goto(`${kibana.internal || kibana.external}/${dashboardUrl}`, {
    waitUntil: 'load',
  });

  await page.waitFor('form');

  await page.waitFor(fields.username);
  await page.type(fields.username, elasticsearch.username);

  await page.waitFor(fields.password);
  await page.type(fields.password, elasticsearch.password);

  await page.keyboard.press('Enter');

  await page.waitFor('.dshLayout--viewing');

  const dashboardViewport = await page.$('.dshLayout--viewing');
  const boundingBox = await dashboardViewport.boundingBox();
  const visualizations = await page.$$('.dshLayout--viewing .react-grid-item');

  await page.setViewport({
    width: print ? viewport.a4.width : viewport.width,
    height: print ? (viewport.a4.height * visualizations.length) : boundingBox.height,
    deviceScaleFactor: 1,
  });

  await page.evaluate((params, ...allVisualizations) => {
    let cssLayout = params.css.preserveLayoutCSS;

    if (params.print) {
      cssLayout += params.css.printCSS;
    }

    const styleNode = document.createElement('style'); // eslint-disable-line no-undef
    styleNode.type = 'text/css';
    styleNode.innerHTML = cssLayout;
    document.head.appendChild(styleNode); // eslint-disable-line no-undef

    if (params.print) {
      allVisualizations.forEach((visualization, index) => {
        visualization.style.setProperty('top', `${(params.viewport.a4.height - params.viewport.margin.top) * index}px`);
      });
    }
  }, { print, css, viewport }, ...visualizations);

  dashboardViewport.dispose();
  visualizations.forEach((v) => v.dispose());

  await page.waitFor(5000);

  const pdfOptions = {
    margin: {
      left: `${viewport.margin.left}px`,
      right: `${viewport.margin.right}px`,
      top: `${viewport.margin.top}px`,
      bottom: `${viewport.margin.bottom}px`,
    },
    printBackground: false,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="width: 1920px; color: black; text-align: center; line-height: 5px">
        <h1 style="font-size: 14px;"><a href="${kibana.external}/${dashboardUrl}">${dashboardTitle}</a></h1>
        <p style="font-size: 10px;">
          Rapport couvrant la période
          du ${formatDate(period.from, 'Pp', { locale: fr })}
          au ${formatDate(period.to, 'Pp', { locale: fr })}
        </p>
        <p style="font-size: 10px;">Généré le ${formatDate(new Date(), 'PPPP', { locale: fr })}</p>
      </div>
    `,
    footerTemplate: `
      <div style="width: 1920px; color: black;">
        <div style="text-align: center;">
          <a href="${kibana.external}"><img src="data:image/png;base64,${css.logo}" width="128px" /></a>
        </div>
        <div style="text-align: right; margin-right: 60px;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      </div>
    `,
  };

  if (print) {
    pdfOptions.format = 'A4';
    pdfOptions.landscape = true;
  } else {
    const height = (boundingBox.height + viewport.margin.top + viewport.margin.bottom);
    pdfOptions.width = viewport.width;
    pdfOptions.height = Math.max(height, 600);
  }

  const pdf = await page.pdf(pdfOptions);

  return pdf || null;
};
