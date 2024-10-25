const environment = {
    currentQR: null,
    currentLink: null
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".data-input").addEventListener("keyup", (e) => {
        if(e.key === "Enter") {
            qrcodeRequest();
        }
    });

    document.querySelector(".file-picker-input").addEventListener("change", (e) => qrcodeFromFileRequest(e));
});

const qrcodeFromFileRequest = async (e) => {
    const file = e.target.files[0];

    const form = new FormData();

    form.append('file', file);

    const response = await fetch('/qr/base64', {
        method: 'POST',
        body: form
    });

    const result = await response.json();

    environment.currentQR = result.image;
    environment.currentPath = result.link;

    document.querySelector('.save-btn').href = result.link;
    
    document.querySelector('.qrcode').src = result.image;

    document.querySelector('.save-btn').style.display = 'flex';
    document.querySelector('.qrcode').style.display = 'flex';
}

const qrcodeRequest = async () => {
    const data = document.querySelector(".data-input").value;

    const response = await fetch(`/qr?data=${data}`, {
        method: 'GET'
    });

    const result = await response.json();

    environment.currentQR = result.image;
    environment.currentPath = result.link;

    document.querySelector('.save-btn').href = result.link;
    
    document.querySelector('.qrcode').src = result.image;

    document.querySelector('.save-btn').style.display = 'flex';
    document.querySelector('.qrcode').style.display = 'flex';
}