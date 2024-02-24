const puppeteer = require('puppeteer-extra');
const Stealth = require('puppeteer-extra-plugin-stealth')
puppeteer.use(Stealth())

const express = require('express')
const app = express()
const port = process.env.PORT;

let browser = {}
app.use(express.json())

app.post('/', async (req, res) => {
    try {
        if (Object.keys(req.body).length === 0) {
            console.warn('Request body must not be empty!')
            res.status(404).send({message: 'Request body must not be empty!'})
        }
        const requestHeaders = req.body.headers
        const requestCookies = req.body.cookies
        console.log(`Requesting content from URL: ${req.query.url} ...`)
        console.log(`With headers: ${JSON.stringify(requestHeaders)} cookies: ${JSON.stringify(requestCookies)}`)
        const html = await getContentFromPage(req.query.url, requestHeaders, requestCookies)
        res.send(html)
    } catch (err) {
        console.error(err)
        res.status(500).send(err)
    }
})

app.listen(port, async () => {
    // Launch headless Chrome browser
    browser = await puppeteer.launch({args: ['--no-sandbox'], executablePath: '/usr/bin/google-chrome'});
    console.log(`App listening on port ${port}`)
})

const getContentFromPage = async (url, requestHeaders, requestCookies) => {

    // Open a new page
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({...requestHeaders})
    const cookies = mapCookies(requestCookies, url)

    await page.setCookie(...cookies)
    await page.goto(url, {timeout: process.env.SITE_NAVIGATION_TIMEOUT});

    await page.waitForFunction(
        'window.performance.timing.loadEventEnd - window.performance.timing.navigationStart >= 500'
    );

    const html = await page.content()
    await page.close()
    return html
};

const mapCookies = (requestCookies, url) => {
    return Object.entries(requestCookies).map(([name, value]) => ({
        name,
        value,
        url,
    }))
}
