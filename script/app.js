"use strict";
(function () {
    function CheckLogin() {
        $("#login").html(`<a id="logout" class="nav-link" href="/login"> <i class="fas fa-sign-out-alt"></i>Logout</a>`);
        $("#logout").on("click", function () {
            sessionStorage.clear();
            location.href = "/login";
        });
    }
    function Loadheader(html_data) {
        if (router.ActiveLink === "login" || router.ActiveLink === "register") {
            $("header").hide();
            return;
        }
        $.get("/views/components/header.html", function (html_data) {
            $("header").html(html_data);
            if (typeof router !== "undefined" && router.ActiveLink) {
                document.title = capitalizeFirstLetter(router.ActiveLink);
                $(`li > a:contains(${document.title})`).addClass("active").attr("aria-current", "page");
            }
            AddNavigationEvents();
            CheckLogin();
        });
    }
    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    function AddNavigationEvents() {
        let navlinks = $("ul>li>a");
        navlinks.off("click");
        navlinks.off("mouseenter");
        navlinks.on("mouseenter", function () {
            $(this).css("cursor", "pointer");
        });
    }
    function DisplayPatientListPage() {
        fetch("./data/patient.json")
            .then((response) => {
            if (!response.ok) {
                throw new Error("Error loading JSON file");
            }
            return response.json();
        })
            .then((data) => {
            buildTable(data);
            displayPatientDetails(data);
        })
            .catch((error) => console.error("Error loading JSON data:", error));
        function buildTable(data) {
            const patientData = document.querySelector("#data-output");
            let output = "";
            for (const patient of data) {
                output += `
        <tr>
          <td>${patient.id}</td>
          <td>${patient.firstName}</td>
          <td>${patient.lastName}</td>
          <td>${patient.age}</td>
          <td>
            <button class="btn btn-primary" onclick="patientInfo('${patient.id}')">View</button>
            <button class="btn btn-primary" onclick="handleAction('${patient.firstName}')">Edit</button>
          </td>
        </tr>
      `;
            }
            patientData.innerHTML = output;
        }
        window.patientInfo = (id) => {
            window.location.href = `/patient_profile#${id}`;
        };
        window.handleAction = (name) => {
            console.log(`Handle action for patient: ${name}`);
        };
        function displayPatientDetails(data) {
            const patientId = getPatientIdFromUrl();
            if (!patientId) {
                console.warn("No patient ID in URL.");
                return;
            }
            const patient = data.find((p) => p.id === patientId);
            const detailDiv = document.getElementById("patientDetail");
            if (patient) {
                const patientInfoHTML = `
                <p><strong>ID:</strong> ${patient.id}</p>
                <p><strong>Name:</strong> ${patient.firstName} ${patient.lastName}</p>
                <p><strong>Gender:</strong> ${patient.gender}</p>
                <p><strong>Age:</strong> ${patient.age}</p>
                <p><strong>Health Card Number:</strong> ${patient.healthCardNumber}</p>
                <p><strong>Email Address:</strong> ${patient.emailAddress}</p>
                <p><strong>Phone Number:</strong> ${patient.phoneNumber}</p>
                <p><strong>Address:</strong> ${patient.address}</p>
              `;
                detailDiv.innerHTML = patientInfoHTML;
            }
            else {
                detailDiv.innerHTML = "<p>Patient not found.</p>";
                console.warn("No matching patient found for ID:", patientId);
            }
        }
        function getPatientIdFromUrl() {
            return window.location.hash ? window.location.hash.substring(1) : null;
        }
    }
    function DisplayAdminDashboardPage() {
        console.log("Called DisplayPatientListPage()");
    }
    const DisplayPrescriptionRequestPage = () => {
        console.log("DisplayPrescriptionRequestPage is running...");
        const userSession = sessionStorage.getItem("user");
        if (!userSession) {
            alert("You need to log in first.");
            window.location.href = "/login";
            return;
        }
        const user = JSON.parse(userSession);
        const patientId = user.id;
        fetch("/data/patientRx.json")
            .then(response => {
            if (!response.ok)
                throw new Error("Error loading prescription data");
            return response.json();
        })
            .then(data => {
            const userPrescriptions = data.find((p) => p.patientId === patientId);
            if (!userPrescriptions) {
                console.warn("No prescriptions found for patient ID:", patientId);
                return;
            }
            console.log("Prescription Data Loaded:", userPrescriptions);
            const tableBody = document.getElementById("rxRequest");
            if (!tableBody) {
                console.error("Table body not found in the document.");
                return;
            }
            tableBody.innerHTML = userPrescriptions.prescriptions.map((prescription, index) => {
                const isDisabled = prescription.status !== "Active" || prescription.requestStatus === "Pending";
                const buttonText = prescription.requestStatus === "Pending" ? "Pending" : "Request Refill";
                return `
                    <tr>
                        <td>${prescription.date}</td>
                        <td>${prescription.rxNum}</td>
                        <td>${prescription.medications.map((med) => med.name).join(", ")}</td>
                        <td>${prescription.medications[0].qty}</td>
                        <td>${prescription.medications[0].days}</td>
                        <td>${prescription.medications[0].remaining}</td>
                        <td>${prescription.medications[0].auth}</td>
                        <td>${prescription.status}</td>
                        <td>
                            <button class="btn btn-success refill-btn" data-index="${index}" ${isDisabled ? "disabled" : ""}>
                                ${buttonText}
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");
            document.querySelectorAll(".refill-btn").forEach((button) => {
                button.addEventListener("click", function (event) {
                    const targetButton = event.currentTarget;
                    handleRefillRequest(userPrescriptions, targetButton);
                });
            });
        })
            .catch(error => console.error("Error fetching prescription data:", error));
    };
    function handleRefillRequest(userPrescriptions, button) {
        const index = parseInt(button.dataset.index || "-1");
        const prescription = userPrescriptions.prescriptions[index];
        prescription.requestStatus = "Pending";
        button.textContent = "Pending";
        button.disabled = true;
        fetch("/update-prescription-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                patientId: userPrescriptions.patientId,
                rxNum: prescription.rxNum,
                newStatus: "Pending",
            }),
        })
            .then(response => response.json())
            .then(data => {
            console.log("Prescription status updated:", data);
        })
            .catch(error => {
            console.error("Error updating prescription status:", error);
        });
        console.log("Refill request sent for:", prescription.rxNum);
    }
    function DisplayLoginPage() {
        console.log("Called DisplayLoginPage()");
        let messageArea = $("#messageArea");
        messageArea.hide();
        $("#loginButton").on("click", function () {
            let success = false;
            let loggedInUser = null;
            let redirectURL = "";
            $.get("./data/users.json", function (data) {
                let username = document.forms[0].username.value;
                let password = document.forms[0].password.value;
                for (const user of data.users) {
                    if (username === user.Username && password === user.Password) {
                        success = true;
                        loggedInUser = {
                            id: user.id,
                            username: user.Username,
                            role: user.Role
                        };
                        if (user.Role === "Admin") {
                            redirectURL = "/admin_dashboard";
                        }
                        else if (user.Role === "Patient") {
                            redirectURL = "/patient_dashboard";
                        }
                        break;
                    }
                }
                if (success) {
                    sessionStorage.setItem("user", JSON.stringify(loggedInUser));
                    messageArea.removeAttr("class").hide();
                    location.href = redirectURL;
                }
                else {
                    $("#username").trigger("focus").trigger("select");
                    messageArea
                        .addClass("alert alert-danger")
                        .text("Error: Invalid Login Credentials")
                        .show();
                }
            });
        });
        $("#cancelButton").on("click", function () {
            document.forms[0].reset();
            location.href = "/home";
        });
    }
    function DisplayRegisterPage() {
        console.log("Called DisplayRegisterPage()");
        document.getElementById('registerForm')?.addEventListener('submit', async function (event) {
            event.preventDefault();
            const getInputValue = (id) => {
                const element = document.getElementById(id);
                return element ? element.value.trim() : null;
            };
            const firstName = getInputValue('firstName');
            const lastName = getInputValue('lastName');
            const emailAddress = getInputValue('emailAddress');
            const address = getInputValue('address');
            const contactNumber = getInputValue('contactNumber');
            const gender = document.getElementById('gender')?.value || null;
            const age = getInputValue('age');
            const healthCardNumber = getInputValue('healthCardNumber');
            const password = getInputValue('password');
            const confirmPassword = getInputValue('confirmPassword');
            if (!firstName || !lastName || !emailAddress || !address || !contactNumber || !gender || !age || !healthCardNumber || !password || !confirmPassword) {
                alert('One or more form fields are missing!');
                return;
            }
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            const formData = {
                firstName,
                lastName,
                emailAddress,
                address,
                contactNumber,
                gender,
                age,
                healthCardNumber,
                password
            };
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Registration successful!');
                    window.location.href = '/login';
                }
                else {
                    alert('Registration failed: ' + result.message);
                }
            }
            catch (error) {
                console.error('Error:', error);
                alert('An error occurred during registration.');
            }
        });
    }
    function DisplayPatientDashboardPage() {
        console.log("DisplayPatientDashboardPage is running");
        const userSession = sessionStorage.getItem("user");
        if (!userSession) {
            alert("You need to log in first.");
            window.location.href = "/login";
            return;
        }
        const user = JSON.parse(userSession);
        const patientId = user.id.trim();
        fetch("/data/patientRx.json")
            .then(response => response.json())
            .then(data => {
            const userPrescriptions = data.find((p) => p.patientId.trim() === patientId);
            const tableBody = document.getElementById("prescriptionTableBody");
            if (!tableBody) {
                console.error("Table body not found.");
                return;
            }
            if (userPrescriptions && userPrescriptions.prescriptions.length > 0) {
                tableBody.innerHTML = "";
                userPrescriptions.prescriptions.forEach((prescription, index) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${prescription.date}</td>
                        <td><a href="#" class="rx-link" data-index="${index}">${prescription.rxNum}</a></td>
                        <td>${prescription.medications.map((med) => med.name).join(", ")}</td>
                        <td>${prescription.status}</td>
                    `;
                    tableBody.appendChild(row);
                });
                updatePrescriptionDetails(userPrescriptions.prescriptions[0]);
                document.querySelectorAll(".rx-link").forEach(link => {
                    link.addEventListener("click", (event) => {
                        event.preventDefault();
                        const target = event.target;
                        const index = parseInt(target.dataset.index);
                        updatePrescriptionDetails(userPrescriptions.prescriptions[index]);
                    });
                });
            }
            else {
                tableBody.innerHTML = `<tr><td colspan="4">No prescriptions found.</td></tr>`;
            }
        })
            .catch(error => console.error("Error fetching prescription data:", error));
    }
    function updatePrescriptionDetails(prescription) {
        document.getElementById("detailRxNumber").textContent = prescription.rxNum;
        document.getElementById("detailDoctor").textContent = prescription.doctor;
        document.getElementById("detailIssued").textContent = prescription.date;
        document.getElementById("detailEnd").textContent = prescription.endDate;
        const detailBody = document.getElementById("prescriptionDetailTBody");
        detailBody.innerHTML = "";
        prescription.medications.forEach((med) => {
            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${med.name}</td>
            <td>${med.dosage}</td>
            <td>${med.notes || "No notes"}</td>
        `;
            detailBody.appendChild(row);
        });
    }
    function Display404Page() {
        console.log("Display404Page() Called..");
    }
    function DisplayRequestProcessPage() {
        console.log("DisplayRefillRequests is running...");
        fetch("/data/patientRx.json")
            .then(response => {
            console.log("Fetching patientRx.json...");
            if (!response.ok)
                throw new Error("Failed to load patientRx.json");
            return response.json();
        })
            .then(patientData => {
            console.log("Loaded patientRx.json:", patientData);
            fetch("/data/patient.json")
                .then(response => {
                console.log("Fetching patient.json...");
                if (!response.ok)
                    throw new Error("Failed to load patient.json");
                return response.json();
            })
                .then(patients => {
                console.log("Loaded patient.json:", patients);
                const tableBody = document.getElementById("requestProcess");
                if (!tableBody) {
                    console.error("Table body not found in the document.");
                    return;
                }
                let refillRequests = [];
                patientData.forEach((patient) => {
                    console.log(`Checking patient ${patient.patientId}`);
                    patient.prescriptions.forEach((prescription) => {
                        if (prescription.requestStatus === "Pending") {
                            console.log(`Pending request found for ${prescription.rxNum}`);
                            const patientDetails = patients.find((p) => p.id === patient.patientId);
                            const patientName = patientDetails ? `${patientDetails.firstName} ${patientDetails.lastName}` : "Unknown";
                            refillRequests.push({
                                patientId: patient.patientId,
                                patientName: patientName,
                                rxNum: prescription.rxNum,
                                medication: prescription.medications.map((med) => med.name).join(", "),
                                status: prescription.status
                            });
                        }
                    });
                });
                console.log("Refill Requests Found:", refillRequests);
                if (refillRequests.length === 0) {
                    console.warn("No pending refill requests found.");
                    return;
                }
                tableBody.innerHTML = refillRequests.map((request, index) => `
                        <tr>
                            <td>${request.patientId}</td>
                            <td>${request.patientName}</td>
                            <td>${request.rxNum}</td>
                            <td>${request.medication}</td>
                            <td>${request.status}</td>
                            <td>
                                <button class="btn btn-primary approve-btn" data-index="${index}">
                                    Approve
                                </button>
                            </td>
                        </tr>
                    `).join("");
                document.querySelectorAll(".approve-btn").forEach(button => {
                    button.addEventListener("click", function (event) {
                        const targetButton = event.currentTarget;
                        const index = parseInt(targetButton.dataset.index);
                        handleApproval(refillRequests[index]);
                    });
                });
                console.log("Table populated successfully.");
            })
                .catch(error => console.error("Error fetching patient details:", error));
        })
            .catch(error => console.error("Error fetching prescription data:", error));
    }
    function handleApproval(request) {
        fetch("/update-prescription-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                patientId: request.patientId,
                rxNum: request.rxNum,
                newStatus: "Approved"
            })
        })
            .then(response => response.json())
            .then(data => {
            console.log("✅ Request approved:", data);
            alert(`Refill request for ${request.rxNum} approved!`);
            location.reload();
        })
            .catch(error => console.error("❌ Error approving request:", error));
    }
    function LoadContent() {
        let page_name = router.ActiveLink;
        let callback = ActiveLinkCallback();
        $.get(`./views/content/${page_name}.html`, function (html_data) {
            $("main").html(html_data);
            callback();
        });
    }
    function AuthGuard() {
        let protected_routes = ["patient_profile", "admin_dashboard"];
        if (protected_routes.indexOf(router.ActiveLink) > -1) {
            if (!sessionStorage.getItem("user")) {
                location.href = "/login";
            }
        }
    }
    function ActiveLinkCallback() {
        switch (router.ActiveLink) {
            case "admin_dashboard": return DisplayAdminDashboardPage;
            case "login": return DisplayLoginPage;
            case "patient_list": return DisplayPatientListPage;
            case "register": return DisplayRegisterPage;
            case "patient_dashboard": return DisplayPatientDashboardPage;
            case "prescription_request": return DisplayPrescriptionRequestPage;
            case "request_process": return DisplayRequestProcessPage;
            case "404": return Display404Page;
            default:
                console.error("ERROR: Callback doesn't exist for ActiveLink - " + router.ActiveLink);
                return function () { };
        }
    }
    function Start() {
        console.log("App Started");
        let html_data = "";
        Loadheader(html_data);
        AuthGuard();
        LoadContent();
    }
    window.addEventListener("load", Start);
})();
//# sourceMappingURL=app.js.map