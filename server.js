"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const mime_types_1 = __importDefault(require("mime-types"));
let lookup = mime_types_1.default.lookup;
const port = process.env.PORT || 5000;
const readJSONFile = (filePath, callback) => {
    fs_1.default.readFile(filePath, 'utf8', (err, data) => {
        if (err)
            throw err;
        callback(JSON.parse(data));
    });
};
const writeJSONFile = (filePath, data, callback) => {
    fs_1.default.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', callback);
};
const server = http_1.default.createServer((req, res) => {
    const path = req.url;
    if (path === "/register" && req.method === "POST") {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const formData = JSON.parse(body);
                readJSONFile(__dirname + '/data/patient.json', (patients) => {
                    const newId = String(patients.length + 1).padStart(3, '0');
                    const newPatient = {
                        id: newId,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        gender: formData.gender,
                        age: parseInt(formData.age),
                        healthCardNumber: formData.healthCardNumber,
                        emailAddress: formData.emailAddress,
                        phoneNumber: formData.contactNumber,
                        address: formData.address
                    };
                    patients.push(newPatient);
                    writeJSONFile(__dirname + '/data/patient.json', patients, () => {
                        console.log("Patient data saved successfully.");
                    });
                    readJSONFile(__dirname + '/data/users.json', (users) => {
                        const newUser = {
                            Role: "Patient",
                            Username: formData.emailAddress,
                            Password: formData.password
                        };
                        users.users.push(newUser);
                        writeJSONFile(__dirname + '/data/users.json', users, () => {
                            console.log("User data saved successfully.");
                        });
                    });
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Registration successful!" }));
            }
            catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Invalid data format" }));
            }
        });
    }
    else {
        let filePath = path;
        if (path === "/" || path === "/home") {
            filePath = "/home.html";
        }
        else if (path === "/prescription_request" || path === "/login"
            || path === "/patient_list" || path === "/admin_dashboard" || path === "/register"
            || path === "/patient_profile" || path === "/report" || path === "/addPatient" || path === "/enterPrescription") {
            filePath = "/index.html";
        }
        let mime_type = lookup(filePath.substring(1));
        fs_1.default.readFile(__dirname + filePath, function (err, data) {
            if (err) {
                res.writeHead(404);
                res.end("Error 404 - File Not Found" + err.message);
                return;
            }
            if (!mime_type) {
                mime_type = "text/plain";
            }
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.writeHead(200, { 'Content-Type': mime_type });
            res.end(data);
        });
    }
});
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
//# sourceMappingURL=server.js.map