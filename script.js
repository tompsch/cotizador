import { cotizar } from "./cotizador.js"

async function main () {
    await getData("brands");
    await getData("provinces");

}
async function getData(dataType, event) {
    const options = {method: 'GET', headers: {Authorization: '', Accept: 'application/json'}};
    let url;
    let displayFunction;
    let query;

    switch (dataType) {
        case("brands"): {
            // FETCHING BRANDS ONCE FROM SCRAPE TO REDUCE REQUESTS
            // https://argautos.com/api/v1/brands?per_page=100
            url = './brands.json';
            displayFunction = (data) => displayData("brands", data);
            break;
        } 
        case("models"): {
            query = event.target.value;
            url = `https://argautos.com/api/v1/brands/${query}/models?page=1&per_page=100`;
            displayFunction = (data) => displayData("models", data);
            break;
        }
        case("versions"): {
            query = event.target.value;
            url = `https://argautos.com/api/v1/models/${query}/versions?page=1&per_page=100`;
            displayFunction = (data) => displayData("versions", data);
            break;
        }
        case("years"): {
            query = event.target.value;
            url = `https://argautos.com/api/v1/versions/${query}/valuations?currency=ARS`;
            displayFunction = (data) => displayData("years", data);
            break;
        }
        case("provinces"): {
            // url = `https://apis.datos.gob.ar/georef/api/v2.0/provincias?campos=basico&max=999&inicio=0`;
            url = `./provincias.json`;
            displayFunction = (data) => displayData("provinces", data);
            break;
        } 
        case("depts"): {
            query = event.target.value;
            // url = `https://apis.datos.gob.ar/georef/api/v2.0/departamentos?provincia=${query}&campos=basico&max=5000&inicio=0`;
            url = `./departamentos.json`;
            displayFunction = (data) => displayData("depts", data);
            break;
        }
    }

    try {
        showModal();
        const response = await fetch(url, options);
        const data = await response.json().then(data => dataType === "provinces" ? data.provincias : (dataType === "depts" ? data.departamentos : data.data));
        displayFunction(data);
    } catch (error) {
        console.error(error);
    }
    hideModal();
}

function showModal() {
    const modal = document.querySelector(".loadingModal");
    modal.classList.add("show");
}
function hideModal() {
    const modal = document.querySelector(".loadingModal");
    modal.classList.remove("show");
}
function displayData (dataType, elements) {
    let input;
    let className;
    let callback;
    let query;
    let objectAccess = "name";

    // JUST BECAUSE GOVERNMENT API REMOVED CORS HEADERS (USING LOCAL DATA)
    if(dataType === "depts") {
        const queryProv = document.querySelector("#province").value;
        elements = elements.filter((department) => department.provincia.id === queryProv);
    }
    //
    switch (dataType) {
        case("brands"): {
            query = "#brand";
            className = "brandElement";
            callback = e => getData("models", e);
            break;
        }
        case("models"): {
            query = "#model";
            className = "modelElement";
            callback = (e) => getData("versions", e)
            break;            
        }
        case("versions"): {
            query = "#version";
            className = "versionElement";
            callback = (e) => getData("years", e)
            break; 
        }
        case("years"): {
            query = "#year";
            className = "yearElement";
            callback = checkForm;
            objectAccess = "year";
            break; 
        }
        case("provinces"): {
            query = "#province";
            className = "province";
            callback = (e) => getData("depts",e);
            objectAccess = "nombre";
            break; 
        }
        case("depts"): {
            query = "#department";
            className = "deptElement";
            objectAccess = "nombre";
            callback = checkForm;
            break; 
        }

    }
    input = document.querySelector(query);
    input.replaceChildren(new Option('', 'null'));
    input.addEventListener('change', callback);
    
    elements.forEach(element => {
        const option = document.createElement('option');
        option.classList.add(className);
        option.innerText = element[objectAccess];
        option.setAttribute('value', element.id);
        dataType === "years" && option.setAttribute('data-price', element.price);

        input.append(option);
    })
    
}

function getPrice() {
    const yearSelect = document.querySelector("#year");
    const selectedOption = yearSelect?.querySelector("option:checked");
    const price = selectedOption?.dataset.price;
    if(price) {
        return price;
    } else {
        console.error("No price found")
        return undefined;
    }    
}
function getLocation() {
    const province = document.querySelector("#province");
    const dept = document.querySelector("#department");

    if(province?.value && dept?.value) return [province.value,dept.value];
    console.error("No location found")
    return undefined;
}

function checkForm () {
    const submitBtn = document.querySelector('.submitFormBtn');
    const form = document.querySelector('form');
    const selects = [...document.querySelectorAll("select")];
    
    let flag = true;
    selects.forEach(select => {
        if (select.value === 'null') flag = false;
    })
    if(flag) {
        const price = getPrice();
        const location = getLocation();
        if(price && location) {
            submitBtn.classList.remove('disable');
            form.addEventListener("submit",e => customSubmit(e, price, location));
        }
    }
    else {
        console.log("Data missing");
    }
}
function customSubmit(e,price,location) {
    e.preventDefault();
    preventTouch();
    const coberturas = ["terceros","todoRiesgoConFranquicia","todoRiesgoSinFranquicia"];
    
    coberturas.forEach(cobertura => {
        cotizar(price, cobertura, "sancor", location[0],location[1]);
    })
    coberturas.forEach(cobertura => {
        cotizar(price, cobertura, "laSegunda", location[0],location[1]);
    })
    const section = document.querySelector(".cotizacion");
    section.classList.remove('hide');
    section.scrollIntoView({ behavior: "smooth" })

}

function preventTouch() {
    const selects = [...document.querySelectorAll("select")];
    const restartBtn = document.querySelector(".restart");
    const form = document.querySelector('form');

    restartBtn.addEventListener("click",() => resetForm(form))

    selects.forEach(select => {
        select.classList.add("block");
    })
}

function resetForm (form) {
    const submitBtn = document.querySelector('.submitFormBtn');
    const section = document.querySelector(".cotizacion");
    const selects = [...document.querySelectorAll("select")];
    selects.forEach(select => {
        select.classList.remove("block");
    }) 
    submitBtn.classList.add("disable");
    form.reset();
    form.scrollIntoView({behavior: "smooth"})
    setTimeout(()=>section.classList.add("hide"),1000)
    
}
const hamb = document.querySelector(".navToggle");
hamb.addEventListener("click",toggleNav);

function toggleNav(e) {
    const navList = document.querySelector(".navList");
    navList.classList.toggle("show");
}
main();
