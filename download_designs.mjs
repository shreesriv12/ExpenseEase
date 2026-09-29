import fs from 'fs';
import https from 'https';
import path from 'path';

const screens = [
  {
    name: "ExpenseEase - Activity History & Feed",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1Y2EzZjI1MDg0NDAwNTRjZmQ2ZmYzMjE2ODlhEgsSBxD7hPHRmwgYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjM1MzQwNjgwNjIyNzM4NzI3&filename=&opi=89354086",
    imgUrl: "https://lh3.googleusercontent.com/aida/AEtjO1UzBIKQ9hrAUvnu62pFtrH5ieE5ZC4_a8x-y1cVYrOt_cMfw1dzAKhDy3FAbbPoLidbfjQyDQhq5UNIrlHvZcdmZzd2B6RgzTw3duVEx5F8ET9we9bxXBlzFdfsTNb4630m6Bv2ZUdC2raGQQHv66B0kwYTmdY9upuN77Lwec29yVYZJMtknwKc5YCe51_YZPR-9OyUd0aqYgPjHQvPK9570FQHj4WsWneLAR4UahQh4HtZHs2bYQm2mDA"
  },
  {
    name: "ExpenseEase - Dashboard",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1Y2EzZjI0NWQ0ZDkwNzNhZjVjZmNiMDYwYTNhEgsSBxD7hPHRmwgYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjM1MzQwNjgwNjIyNzM4NzI3&filename=&opi=89354086",
    imgUrl: "https://lh3.googleusercontent.com/aida/AEtjO1UsorVOZ6cxBb04pk279Wp2547bZER07roO4sKdkZ8GHN9D9nG-Qc7Rio88LJJ0GWjzC85P5jrppr6QP_J_uVklSSITFVWJHnYZKvxjI_xz8B_bCw8CtC4Gyr6SzPbCFVUIyDZlrBxkU7KLrMWHfcGh0gH0HV3p2lLkQae0H_ZBVOrM1_TxiatFaUnk_1hD_L3gVQ9vqQV0_MoKKpXdIoK-ZV74lImHGeiSl5yQsfsN6B41x9lxH5hd0wo"
  },
  {
    name: "ExpenseEase - Expenses Tab",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1Y2EzZjMwODJlOTgwOTEwNGQ0ZTQ2M2Q2NDhmEgsSBxD7hPHRmwgYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjM1MzQwNjgwNjIyNzM4NzI3&filename=&opi=89354086",
    imgUrl: "https://lh3.googleusercontent.com/aida/AEtjO1V0O27KOwGoGg2SERPspwKqOMf7l3qgO1hQOjzOK-gUI4xpU-BVOAxb0b3Qcy96cHQLzydzYk8xISoBJ6E87CuuxpC8JMe1QZ7TI2wFvFQGaLQyoxeI2oakkfs79LVipzMmJ-BTHrdaZAXTeqrbBVJZFitGeat42d3YfFy3sm8h5uYqErqMo-6xIAnzZxxDnWicAr9DhDdQY0EuKOF-XL6xGx4MPTzasu0F-nWwLwlZDKUXGqAp3GwGFhs"
  },
  {
    name: "ExpenseEase - Authentication",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1Y2EzZjE0NTMxOGMwOTEwN2ZlNjYyMDM1NDI0EgsSBxD7hPHRmwgYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjM1MzQwNjgwNjIyNzM4NzI3&filename=&opi=89354086",
    imgUrl: "https://lh3.googleusercontent.com/aida/AEtjO1Weh_kCbodhSEVV6UtAq8HkZz3sylBjqKwwXuYZroBDSUijHZpv3Ogjvh1bNenvZi_cDSZRT4fddGnIzfyI_pJJd_r63UvbH0vJxgq6Rz87gXp8RhUKzPJrk5GJiiAhAhJMMf9WwcWojkMT9s-ZK1LiThGGidZ1P6LeY1KYkrOtBBmbXMctWaF4slpL-spStRr9ViGoBfsYl1-pIXxx38QwglujFNfwhkmjgO_gQ1R38Q4Doz_YV1v-5Q"
  },
  {
    name: "ExpenseEase - Group Detail & States",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1Y2EzZjI4M2UyYzEwMmE5ODBkODNhMTA3MjkxEgsSBxD7hPHRmwgYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjM1MzQwNjgwNjIyNzM4NzI3&filename=&opi=89354086",
    imgUrl: "https://lh3.googleusercontent.com/aida/AEtjO1URGQugS-2q5NcF9Do0tswzNlgjJzHMHpWgDAJwVXWZ5WUEjSRyyVtMrK8DGWuVwOmpR_GcG87UG7gOtGParSqzIzXfMqYfJ5jLsJ5u_Ybw4uMm1qOPEcbJpxrpW_xRD_aai9rlsnBZLlSCNYaRZZAUo69mDc1k5PRnEyeW2VQ_VY0kECKWdHijnAgZFzIZT4UpNFRgnOLX4DH11XM7EAfjSoFQIcvfuTDyAXh9jtF7Zjrd81cprnxPeKI"
  },
  {
    name: "ExpenseEase Logo",
    htmlUrl: null,
    imgUrl: "https://lh3.googleusercontent.com/aida/AEtjO1Uzh3lEZuhmwXOPv2L_3GWz8rR2qUIVfemH_SrhbUs6TzA8Q2QqY42tYBJ2Y8vBWqBF_8jrTHSzQ7pDT64hzUc8JsPicNzagwnTwoT3xN2z6NtibZjOvozDk-rlLPDbn8zrdUbZqRrcHdnvCzmes7hJFCcFvtg0anyRb8ZrapKLAzI8HNfWV0PX6ZvfX1KU-2invEN6pveI00X4rDyr-_MXIEWq0TQRPWlSwwtJ9hXd_xAB4qwGceHw66w"
  },
  {
    name: "ExpenseEase - Balances & Settlement",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1Y2EzZjIyYjg4MWIwNzNhZjExYjk3MDkwNmNiEgsSBxD7hPHRmwgYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjM1MzQwNjgwNjIyNzM4NzI3&filename=&opi=89354086",
    imgUrl: "https://lh3.googleusercontent.com/aida/AEtjO1UuBDba2OxWgXL6Q13o9aBGjFuOUxz-7b381Tf1z0PqhhLBHbDOis2AHoxYz7PgknonSS1EF5RvpkAZi8Rrrn1pGtXhiBGqaBh-wfzn4pOUuKrh_Wg_Fl0-j6e0WIf659E8WmFHyYpw2uW_b-Wnj3hHOBasD2iJXBBBtLu9y0Ivxupmu5ZYwmWDIqohHUeUyx3SPDo9ur8cT4QNpvLbhrBb7HesBWxfaztMorh1j82fYxMfwnwdZzlMAQ"
  },
  {
    name: "ExpenseEase - Balances Tab 1",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2JkYjQwNjQ2ZTA1YzRkOTBhZmFmNjA5ZDE2MWY3YTJhEgsSBxD7hPHRmwgYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjM1MzQwNjgwNjIyNzM4NzI3&filename=&opi=96797242",
    imgUrl: "https://lh3.googleusercontent.com/aida/AEtjO1Un96yZw1P3V7gYK4k190SOH7H5x197TNPZ_fU5DQOBKLvpDqE2CsaaIjdZNRxgRaO7cjrc3GdEFlhiLO7H0X4BDp_1VJb-fQ4DZRJQFXuKkJRWACGrbq1AsSlYeZd6edYwU8vHs7vrFvjnXS00fN-s0gy9-973hTW2uPciAMM_4Jh33i2ge1ln6R8Yf3HNECYoqOj6iOg1HF-oWwoOtH9yfWIkLCR0r3kXiYG4hyVT_fa3uPqrmyliJnI"
  },
  {
    name: "ExpenseEase - Balances Tab 2",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2I2ZDVjNzA1ZDY4NDRlY2JiYWRlNTMyMTg1MTdkZGQ3EgsSBxD7hPHRmwgYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjM1MzQwNjgwNjIyNzM4NzI3&filename=&opi=96797242",
    imgUrl: "https://lh3.googleusercontent.com/aida/AEtjO1X5UJYsnpykkeatZyBAFii_IBaX4U95Mtu_oHwkSe7pdl253J0fV5pWsK96CHUyeMco9XDeWO0Im-JpT4wx_9bqQW7Mt3sKA7Pswe6tv-UdnVZeHvCB8BUgK8QwZwpcJLUpWgjNOwF2cmvmSKALkb_ZpymAqOU_U6DiOjawHmqIy5sdUuT3PkmZQLxo4A_vKyhXAr7sSRYXEwLvNeUHgLKxdGbogrAiPAVwMXbXAhdUfi-rFEGPWTrA600"
  }
];

const dir = path.join(process.cwd(), 'designs');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const download = (url, dest) => {
    if (!url) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                https.get(response.headers.location, (res2) => {
                    res2.pipe(file);
                    file.on('finish', () => { file.close(resolve); });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => { file.close(resolve); });
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

async function main() {
    for (const screen of screens) {
        const safeName = screen.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        if (screen.htmlUrl) {
            console.log(`Downloading HTML for ${screen.name}...`);
            await download(screen.htmlUrl, path.join(dir, `${safeName}.html`));
        }
        if (screen.imgUrl) {
            console.log(`Downloading Image for ${screen.name}...`);
            await download(screen.imgUrl, path.join(dir, `${safeName}.png`));
        }
    }
    console.log("All downloads completed!");
}

main().catch(console.error);
