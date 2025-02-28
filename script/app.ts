"use strict";

interface Medication {
    name: string;
    dosage: string;
    qty: number;
    days: number;
    remaining: number;
    auth: string;
    notes: string;
}

interface Prescription {
    rxNum: string;
    date: string;
    doctor: string;
    status: string;
    endDate: string;
    medications: Medication[];
    action: string;
}

interface PatientPrescription {
    patientId: string;
    prescriptions: Prescription[];
}


(function (){


    function CheckLogin() {
        // if (sessionStorage.getItem("user")) {
        //     $("#login").html(`<a id="logout" class="nav-link" href="#"> <i class="fas fa-sign-out-alt"></i>Logout</a>`);
        //
        // }
        $("#login").html(`<a id="logout" class="nav-link" href="/login"> <i class="fas fa-sign-out-alt"></i>Logout</a>`);
        $("#logout").on("click", function() {
            sessionStorage.clear();
            location.href = "/login";
        });
    }

    function Loadheader(html_data: string): void {

        if (router.ActiveLink === "login"|| router.ActiveLink === "register") {
            $("header").hide();
            return;
        }

        $.get("/views/components/header.html", function (html_data) {
            $("header").html(html_data);

            // Ensure router is defined and has ActiveLink
            if (typeof router !== "undefined" && router.ActiveLink) {
                document.title = capitalizeFirstLetter(router.ActiveLink);
                $(`li > a:contains(${document.title})`).addClass("active").attr("aria-current", "page");
            }

            AddNavigationEvents();
            CheckLogin();
        });
    }

    function capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    function AddNavigationEvents(): void {
        let navlinks: JQuery<HTMLElement> = $("ul>li>a");
        navlinks.off("click");
        navlinks.off("mouseenter");
        navlinks.on("mouseenter", function () {
            $(this).css("cursor", "pointer");
        });
    }



    function DisplayPatientListPage(): void {
        interface Patient {
            id: string;
            firstName: string;
            lastName: string;
            gender: string;
            age: number;
            healthCardNumber: number;
            emailAddress: string;
            phoneNumber: number;
            address: string;
        }

        fetch("./data/patient.json")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Error loading JSON file");
                }
                return response.json();
            })
            .then((data: Patient[]) => {
                buildTable(data);
                displayPatientDetails(data);
            })
            .catch((error: Error) => console.error("Error loading JSON data:", error));

        function buildTable(data: Patient[]): void {
            const patientData = document.querySelector("#data-output") as HTMLElement;
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

        (window as any).patientInfo = (id: string): void => {
            window.location.href = `/patient_profile#${id}`;


        };

        (window as any).handleAction = (name: string): void => {
            console.log(`Handle action for patient: ${name}`);
        };

        function displayPatientDetails(data: Patient[]): void {
            const patientId = getPatientIdFromUrl();

            if (!patientId) {
                console.warn("No patient ID in URL.");
                return;
            }

            const patient = data.find((p) => p.id === patientId);

            const detailDiv = document.getElementById("patientDetail") as HTMLElement;

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
            } else {
                detailDiv.innerHTML = "<p>Patient not found.</p>";
                console.warn("No matching patient found for ID:", patientId);
            }
        }

        function getPatientIdFromUrl(): string | null {
            return window.location.hash ? window.location.hash.substring(1) : null;
        }
    }








    function DisplayAdminDashboardPage(): void {
        console.log("Called DisplayPatientListPage()");

    }


    const DisplayPrescriptionRequestPage = (): void => {
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
                if (!response.ok) throw new Error("Error loading prescription data");
                return response.json();
            })
            .then(data => {
                const userPrescriptions = data.find((p: any) => p.patientId === patientId);

                if (!userPrescriptions) {
                    console.warn("No prescriptions found for patient ID:", patientId);
                    return;
                }

                console.log("Prescription Data Loaded:", userPrescriptions);

                // Get the table body
                const tableBody = document.getElementById("rxRequest") as HTMLTableSectionElement;
                if (!tableBody) {
                    console.error("Table body not found in the document.");
                    return;
                }

                // Populate table
                tableBody.innerHTML = userPrescriptions.prescriptions.map((prescription: any, index: number) => {
                    const isDisabled = prescription.status !== "Active" || prescription.requestStatus === "Pending";
                    const buttonText = prescription.requestStatus === "Pending" ? "Pending" : "Request Refill";

                    return `
                    <tr>
                        <td>${prescription.date}</td>
                        <td>${prescription.rxNum}</td>
                        <td>${prescription.medications.map((med: any) => med.name).join(", ")}</td>
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

                // Add event listeners for refill buttons
                document.querySelectorAll(".refill-btn").forEach((button) => {
                    button.addEventListener("click", function (event) {
                        const targetButton = event.currentTarget as HTMLButtonElement; // Ensure correct typing
                        handleRefillRequest(userPrescriptions, targetButton);
                    });
                });


            })
            .catch(error => console.error("Error fetching prescription data:", error));
    }

    function handleRefillRequest(userPrescriptions: any, button: HTMLButtonElement) {
        const index: number = parseInt(button.dataset.index || "-1");
        const prescription = userPrescriptions.prescriptions[index];

        // Update UI
        prescription.requestStatus = "Pending";
        button.textContent = "Pending";
        button.disabled = true;

        // Send update to backend
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
            let loggedInUser: { id: string; username: string; role: string } | null = null;
            let redirectURL = ""; // This will store the redirection path

            $.get("./data/users.json", function (data) {
                let username: string = document.forms[0].username.value;
                let password: string = document.forms[0].password.value;

                for (const user of data.users) {
                    if (username === user.Username && password === user.Password) {
                        success = true;
                        loggedInUser = {
                            id: user.id,
                            username: user.Username,
                            role: user.Role
                        };

                        // Set redirection based on user role
                        if (user.Role === "Admin") {
                            redirectURL = "/admin_dashboard"; // Redirect Admin
                        } else if (user.Role === "Patient") {
                            redirectURL = "/patient_dashboard"; // Redirect Patient
                        }

                        break;
                    }
                }

                if (success) {
                    sessionStorage.setItem("user", JSON.stringify(loggedInUser));
                    messageArea.removeAttr("class").hide();
                    location.href = redirectURL; // Redirect user to the appropriate page
                } else {
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
        document.getElementById('registerForm')?.addEventListener('submit', async function (event: Event) {
            event.preventDefault(); // Prevent the default form submission

            // Gather form data safely
            const getInputValue = (id: string): string | null => {
                const element = document.getElementById(id) as HTMLInputElement | null;
                return element ? element.value.trim() : null;
            };

            const firstName = getInputValue('firstName');
            const lastName = getInputValue('lastName');
            const emailAddress = getInputValue('emailAddress');
            const address = getInputValue('address');
            const contactNumber = getInputValue('contactNumber');
            const gender = (document.getElementById('gender') as HTMLSelectElement | null)?.value || null;
            const age = getInputValue('age');
            const healthCardNumber = getInputValue('healthCardNumber');
            const password = getInputValue('password');
            const confirmPassword = getInputValue('confirmPassword');

            // Check if any field is missing
            if (!firstName || !lastName || !emailAddress || !address || !contactNumber || !gender || !age || !healthCardNumber || !password || !confirmPassword) {
                alert('One or more form fields are missing!');
                return;
            }

            // Validate passwords match
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

            // Send the data to the server
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
                } else {
                    alert('Registration failed: ' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during registration.');
            }
        });

    }
    // function DisplayAddPatientPage() {
    //     console.log("Called DisplayAddPatientPage()");
    //     document.getElementById('patientForm')?.addEventListener('submit', async function (event: Event) {
    //         event.preventDefault(); // Prevent the default form submission
    //
    //         // Gather form data safely
    //         const getInputValue = (id: string): string | null => {
    //             const element = document.getElementById(id) as HTMLInputElement | null;
    //             return element ? element.value.trim() : null;
    //         };
    //
    //         const firstName = getInputValue('AddPatientFirstname');
    //         const lastName = getInputValue('AddPatientLastname');
    //         const emailAddress = getInputValue('AddEmailAddress');
    //         const address = getInputValue('AddAddress');
    //         const contactNumber = getInputValue('AddPhoneNumber');
    //         const gender = getInputValue('AddGender');
    //         const age = getInputValue('AddDateOfBirth');
    //         const healthCardNumber = getInputValue('AddHealthCardNumber');
    //
    //         // Check if any field is missing
    //         if (!firstName || !lastName || !emailAddress || !address || !contactNumber || !gender || !age || !healthCardNumber) {
    //             alert('One or more form fields are missing!');
    //             return;
    //         }
    //
    //         // Validate passwords match
    //
    //
    //         const formData = {
    //             firstName,
    //             lastName,
    //             emailAddress,
    //             address,
    //             contactNumber,
    //             gender,
    //             age,
    //             healthCardNumber
    //         };
    //
    //         // Send the data to the server
    //         try {
    //             const response = await fetch('/addPatient', {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify(formData)
    //             });
    //
    //             const result = await response.json();
    //             if (response.ok) {
    //                 alert('Creation successful!');
    //
    //             } else {
    //                 alert('Registration failed');
    //             }
    //         } catch (error) {
    //             console.error('Error:', error);
    //             alert('An error occurred during registration.');
    //         }
    //     });
    //
    // }

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

                const userPrescriptions = data.find(
                    (p: { patientId: string }) => p.patientId.trim() === patientId
                );


                const tableBody = document.getElementById("prescriptionTableBody") as HTMLTableSectionElement | null;
                if (!tableBody) {
                    console.error("Table body not found.");
                    return;
                }

                if (userPrescriptions && userPrescriptions.prescriptions.length > 0) {
                    tableBody.innerHTML = ""; // Clear previous content

                    userPrescriptions.prescriptions.forEach((prescription: any, index: number) => {

                        const row = document.createElement("tr");
                        row.innerHTML = `
                        <td>${prescription.date}</td>
                        <td><a href="#" class="rx-link" data-index="${index}">${prescription.rxNum}</a></td>
                        <td>${prescription.medications.map((med: any) => med.name).join(", ")}</td>
                        <td>${prescription.status}</td>
                    `;
                        tableBody.appendChild(row);
                    });

                    // Show details of the FIRST prescription by default
                    updatePrescriptionDetails(userPrescriptions.prescriptions[0]);

                    // Attach Click Event to Rx Numbers
                    document.querySelectorAll(".rx-link").forEach(link => {
                        link.addEventListener("click", (event) => {
                            event.preventDefault();
                            const target = event.target as HTMLAnchorElement;
                            const index = parseInt(target.dataset.index as string);
                            updatePrescriptionDetails(userPrescriptions.prescriptions[index]);
                        });
                    });

                } else {
                    tableBody.innerHTML = `<tr><td colspan="4">No prescriptions found.</td></tr>`;
                }
            })
            .catch(error => console.error("Error fetching prescription data:", error));
    }

    /**
     * Update Prescription Details Section
     */
    function updatePrescriptionDetails(prescription: any) {

        document.getElementById("detailRxNumber")!.textContent = prescription.rxNum;
        document.getElementById("detailDoctor")!.textContent = prescription.doctor;
        document.getElementById("detailIssued")!.textContent = prescription.date;
        document.getElementById("detailEnd")!.textContent = prescription.endDate;

        const detailBody = document.getElementById("prescriptionDetailTBody") as HTMLTableSectionElement;
        detailBody.innerHTML = ""; // Clear existing data

        prescription.medications.forEach((med: any) => {
            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${med.name}</td>
            <td>${med.dosage}</td>
            <td>${med.notes || "No notes"}</td>
        `;
            detailBody.appendChild(row);
        });
    }







    function Display404Page(){
        console.log("Display404Page() Called..");
    }




    function LoadContent(): void {
        let page_name: string = router.ActiveLink;
        let callback: () => void = ActiveLinkCallback();
        $.get(`./views/content/${page_name}.html`, function(html_data: string): void {
            $("main").html(html_data);
            callback();
        });
    }
    function AuthGuard(){
        let protected_routes = ["patient_profile","admin_dashboard"];

        if(protected_routes.indexOf(router.ActiveLink) > -1){
            if(!sessionStorage.getItem("user")) {
                location.href = "/login";
            }
        }
    }


    function ActiveLinkCallback(): () => void {
        switch(router.ActiveLink) {
            case "admin_dashboard": return DisplayAdminDashboardPage;
            case "login": return DisplayLoginPage;
            case "patient_list": return DisplayPatientListPage;
            case "register": return DisplayRegisterPage;
            // case "addPatient": return DisplayAddPatientPage;
            case "patient_dashboard": return DisplayPatientDashboardPage;
            case "prescription_request": return DisplayPrescriptionRequestPage;
            case "404": return Display404Page;
            default:
                console.error("ERROR: Callback doesn't exist for ActiveLink - " + router.ActiveLink);
                return function() {};
        }
    }


    function Start(): void {
        console.log("App Started");
        let html_data: string = "";
        Loadheader(html_data);
        AuthGuard();
        LoadContent();
    }


    window.addEventListener("load",Start);

})()