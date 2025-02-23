"use strict";



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



    function DisplayPrescriptionRequestPage(): void {
        console.log("Called DisplayPrescriptionRequestPage()");

    }





    function DisplayLoginPage() {
        console.log("Called DisplayLoginPage()");
        let messageArea = $("#messageArea");
        messageArea.hide();

        $("#loginButton").on("click", function () {
            let success = false;
            let newUser = new core.User();
            let redirectURL = ""; // This will store the redirection path

            $.get("./data/users.json", function (data) {
                let username: string = document.forms[0].username.value;
                let password: string = document.forms[0].password.value;

                for (const user of data.users) {
                    if (username === user.Username && password === user.Password) {
                        success = true;
                        newUser.fromJSON(user);

                        // Set redirection based on user role
                        if (user.Role === "Admin") {
                            redirectURL = "/admin_dashboard"; // Redirect Admin
                        } else if (user.Role === "Patient") {
                            redirectURL = "/patient_list"; // Redirect Patient
                        }

                        break;
                    }
                }

                if (success) {
                    sessionStorage.setItem("user", newUser.serialize() as string);
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
            // case "patient_profile": return DisplayPatientProfilePage;
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