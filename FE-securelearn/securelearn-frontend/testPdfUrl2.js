import axios from "axios";

const run = async () => {
    try {
        const loginRes = await axios.post("https://securelearn-backend.onrender.com/api/auth/login", {
            email: "sarathy123@gmail.com",
            password: "sarathypassword" // Assuming typical password, but let me check auth logic or just ask for token.
        });
        const token = loginRes.data.accessToken;

        const id = "69afcc1aa2f401acf36e2e29";
        const urlRes = await axios.get(`https://securelearn-backend.onrender.com/api/student/pdf/url/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Signed URL response:", urlRes.data);

        const signedUrl = typeof urlRes.data === 'string' ? urlRes.data : urlRes.data.url;

        // Now try to fetch it
        try {
            // Let's print out what axios parses the URL as
            console.log("Fetching from:", signedUrl);

            const pdfRes = await axios.get(signedUrl, {
                responseType: "arraybuffer",
                headers: {
                    Accept: "application/pdf"
                } // Notice I am NOT adding Authorization header here, this is what the frontend does.
            });
            console.log("PDF fetch success, status:", pdfRes.status);
        } catch (pdfErr) {
            console.error("PDF fetch error:", pdfErr.response?.status, pdfErr.message);
        }

    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
};

run();
