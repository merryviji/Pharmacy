import http from "http";
import fs from 'fs';
// @ts-ignore
import mime from 'mime-types';

let lookup = mime.lookup;

const port = process.env.PORT || 5000;

// Helper function to read and parse JSON files
const readJSONFile = (filePath: string, callback: (data: any) => void) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) throw err;
        callback(JSON.parse(data));
    });
};

// Helper function to write to JSON files
const writeJSONFile = (filePath: string, data: any, callback: () => void) => {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', callback);
};

const server = http.createServer((req, res) => {
    const path = req.url as string;

    if (path === "/register" && req.method === "POST") {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const formData = JSON.parse(body);

                // Generate a new ID for the patient
                readJSONFile(__dirname + '/data/patient.json', (patients) => {
                    const newId = String(patients.length + 1).padStart(3, '0');

                    // Create a new patient object
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

                    // Add the new patient to the patient.json file
                    patients.push(newPatient);
                    writeJSONFile(__dirname + '/data/patient.json', patients, () => {
                        console.log("Patient data saved successfully.");
                    });

                    // Add the new user to the users.json file
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

                // Send a success response back to the client
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Registration successful!" }));
            } catch (error) {
                // Handle JSON parsing or other errors
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Invalid data format" }));
            }
        });
    } else {
        // Serve static files for all other routes
        let filePath = path;
        if (path === "/" || path === "/home") {
            filePath = "/home.html";
        } else if (path === "/prescription_request" || path === "/login"
            || path === "/patient_list" || path === "/admin_dashboard" || path === "/register"
            || path === "/patient_profile" || path === "/report" || path ==="/addPatient") {
            filePath = "/index.html";
        }

        let mime_type = lookup(filePath.substring(1));

        fs.readFile(__dirname + filePath, function (err, data) {
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