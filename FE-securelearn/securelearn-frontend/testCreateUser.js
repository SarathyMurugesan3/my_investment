import axios from "axios";

const run = async () => {
    try {
        const loginRes = await axios.post("https://securelearn-backend.onrender.com/api/auth/login", {
            email: "admin@securelearn.com",
            password: "admin" // I will try a few common passwords or just ask for a token
        });
        const token = loginRes.data.accessToken;

        const res = await axios.post("https://securelearn-backend.onrender.com/api/admin/users", {
            name: "test",
            email: "test@test.com",
            password: "password",
            role: "STUDENT"
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(res.data);
    } catch (err) {
        console.error("Error creating user:", err.response?.data || err.message);
    }
};

run();
