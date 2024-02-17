const puppeteer = require('puppeteer-extra');
const Stealth = require('puppeteer-extra-plugin-stealth')
puppeteer.use(Stealth())

const express = require('express')
const app = express()
const port = process.env.PORT;

app.use(express.json())

app.post('/', async (req, res) => {
    try {
        const requestHeaders = req.body.headers
        const requestCookies = req.body.cookies
        const html = await emulateBrowser(req.query.url, requestHeaders, requestCookies)
        res.send(html)
    } catch (err) {
        console.error(err)
        res.status(500).send(err)
    }
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})

const emulateBrowser = async (url, requestHeaders, requestCookies) => {
    // Launch headless Chrome browser
    const browser = await puppeteer.launch({args: ['--no-sandbox'], executablePath: '/usr/bin/google-chrome'});

    // Open a new page
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({...requestHeaders})
    const cookies = mapCookies(requestCookies, url)

    await page.setCookie(...cookies)
    await page.goto(url, {timeout: process.env.SITE_NAVIGATION_TIMEOUT});

    return await page.content()
};

const mapCookies = (requestCookies, url) => {
    return Object.entries(requestCookies).map(([name, value]) => ({
        name,
        value,
        url,
    }))
}
