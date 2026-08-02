import axios from "axios";

const run = async () => {
    try {
        const loginRes = await axios.post("https://securelearn-backend.onrender.com/api/auth/login", {
            email: "student@securelearn.com",
            password: "password123" // Replace if needed, but I'll use sarathy123@gmail.com if that works. Let's try it.
        });
        const token = loginRes.data.accessToken;

        // I need to fetch the content list to get a valid PDF ID
        const contentRes = await axios.get("https://securelearn-backend.onrender.com/api/student/content", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const pdfContent = contentRes.data.find(c => c.type === 'PDF');
        if (!pdfContent) {
            console.log("No PDF content found");
            return;
        }

        const id = pdfContent.id;
        console.log("Found PDF ID:", id);

        const urlRes = await axios.get(`https://securelearn-backend.onrender.com/api/student/pdf/url/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Signed URL response:", urlRes.data);

        const signedUrl = typeof urlRes.data === 'string' ? urlRes.data : urlRes.data.url;

        // Now try to fetch it
        try {
            const pdfRes = await axios.get(signedUrl, {
                responseType: "arraybuffer",
                headers: {
                    Accept: "application/pdf",
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("PDF fetch success, status:", pdfRes.status);
        } catch (pdfErr) {
            console.error("PDF fetch error:", pdfErr.response?.status, pdfErr.response?.data?.toString());
        }

    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
};

run();
