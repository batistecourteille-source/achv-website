(async () => {
    try {
        const url = "https://www.instagram.com/p/CNkRg7Rpw9P/media/?size=l";
        const res = await fetch(url, { redirect: 'manual' });
        console.log("Status:", res.status);
        if (res.status === 301 || res.status === 302 || res.status === 307) {
            console.log("Redirect:", res.headers.get('location'));
        } else {
            console.log("No redirect, status:", res.status);
        }
    } catch (e) {
        console.error(e);
    }
})();
