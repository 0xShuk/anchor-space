const state = document.getElementById("input-state");
const vectorsUI = document.getElementById("vectors");
const stringsUI = document.getElementById("strings");
const customTypesUI = document.getElementById("customs");
const result = document.querySelector(".space-box");
const customVectorsUI = document.getElementById("vectors");
const customStringsUI = document.getElementById("strings");
const outputCodeUI = document.querySelector(".output-code");
const outputWrapper = document.querySelector(".output-wrapper");

let vectors = [];
let strings = [];

let customTypes = [];

let stateName = "";

/* 
    type Space = {
        name: string,
        space: number,
        multiplier: number,
        isVector: boolean,
        isOption: boolean,
        isDouble: boolean,
        doubleDetails?: {
            space: number,
            multiplier: number
        }
    }
*/
let spaces = []; //Space[]

let customSpace = [];

state.addEventListener("input", e => {
    let code = state.value.split("{");
    stateName = code[0].substring((code[0].indexOf("struct") + 7), code[0].length).trim();

    if (code.length > 1) {
        code = code[1].split(",")

        code.forEach((field,index) => {
            if (index === 0) {
                vectors = [];
                strings = [];
                customTypes = [];
                spaces = [];
                customSpace = [];

            }

            if (!field.includes(":")) {
                return;
            }

            let [name, type] = field.split(":");
            
            type = type.replace("}", "").trim();

            name = name.trim();
            name = name.substring(name.lastIndexOf(" "), name.length).trim();

            if (primitives.includes(type)) {
                // primitives
                const newSpace = pValue[primitives.indexOf(type)];

                spaces.push({name, space: newSpace, multiplier: 1, isVector: false, isDouble: false, isOption: false});
            } else if (type.includes("Vec")) {
                // vector
                let pType = type.split("<");

                if (pType.length < 3) {
                    pType = pType[1].replace(">", "").trim();
                } else {
                    pType = pType.slice(1, pType.length).join("").replace("Vec", "Vec<").replace(">", "").trim();
                }

                vectors.push({name, type: pType, id: spaces.length})

                if (primitives.includes(pType)) {
                    // vec of primitives
                    let space = pValue[primitives.indexOf(pType)];

                    spaces.push({name, space, multiplier: 1, isVector: true, isDouble: false, isOption: false});
                } else if (pType === "String") {
                    // vec of strings
                    strings.push({name, type: "vector", id: spaces.length});
                    spaces.push({name, space: 0, multiplier: 1, isVector: true, isDouble: false, isOption: false});
                } else if (pType.includes("Vec")) {
                    // vec of vecs
                    const ppType = pType.split("<")[1].replace(">", "").trim();

                    vectors.push({name, type: "inner: "+ppType, id: spaces.length + "A"})

                    if (primitives.includes(ppType)) {
                        // vec of vec of primitives
                        let space = pValue[primitives.indexOf(ppType)];
                        spaces.push({name, space: 0, multiplier: 1, isVector: true, isDouble: true, isOption: false,
                         doubleDetails: {
                            space,
                            multiplier: 1 
                        }});

                    } else if (ppType === "String") {
                        // vec of vec of strings
                        strings.push({name, type: "vector", id: spaces.length + "A"});

                        spaces.push({name, space: 0, multiplier: 1, isVector: true, isDouble: true, isOption: false,
                         doubleDetails: {
                            space: 0,
                            multiplier: 1 
                        }});
                    }

                } else {
                    // vec of customs
                    customTypes.push({name, type: pType, id: spaces.length});
                    spaces.push({name, space: 0, multiplier: 1, isVector: true, isDouble: false, isOption: false})
                }
                
            } else if (type === "String") {
                // string
                strings.push({name, type: "individual", id: spaces.length})
                spaces.push({name, space: 0, multiplier: 1, isVector: false, isDouble: false, isOption: false});

            } else if (type.includes("Option")) {
                // option - currently only for primitives & strings
                let oType = type.split("<")[1].replace(">", "").trim();

                if (primitives.includes(oType)) {
                    let newSpace = pValue[primitives.indexOf(oType)];
                    spaces.push({name, space: newSpace + 1, multiplier: 1, isVector: false, isDouble: false, isOption: true});

                } else if (oType === "String") {
                    strings.push({name, type: "option", id: spaces.length})
                    spaces.push({name, space: 0, multiplier: 1, isVector: false, isDouble: false, isOption: true});
                }
                
            } else if (type.includes("[")) {
                // Array
                let [pType, pCount] = type.split(";");
                pType = pType.replace("[", "").trim();
                pCount = parseInt(pCount.replace("]", "").trim());

                const newSpace = pValue[primitives.indexOf(pType)] * pCount;
                spaces.push({name, space: newSpace, multiplier: 1, isVector: false, isDouble: false, isOption: false});

            } else {
                // Custom
                customTypes.push({name, type, id: spaces.length});
                spaces.push({name, space: 0, multiplier: 1, isVector: false, isDouble: false, isOption: false})
            }
        });
    }

    fillCustomTypes();
    fillVectors();
    fillStrings();

    calcSpace();

    outputWrapper.style.visibility = 'visible'
});

function fillCustomTypes() {
    customTypesUI.innerHTML = "";

    customTypes.forEach(cType => {
        customTypesUI.insertAdjacentHTML("beforeend", `
            <div class="input-div inserted-obj2">
                Type of ${cType.type} <br>
                <select class="input-type" data-id="${cType.id}" data-name="${cType.type}">
                    <option value="">Select One</option>
                    <option value="enum">enum</option>
                    <option value="struct">struct</option>
                </select>

            </div>
        `);
    })
}

function fillVectors() {
    vectorsUI.innerHTML = "";

    if (vectors.length > 0) {
        vectorsUI.insertAdjacentHTML("beforeend",
            `<div class="field-desc">Enter the max items of each Vec</div>`
        );
    }

    vectors.forEach(vec => {
        const type = vec.type.includes("Vec") ? "outer: Vec" : vec.type;

        vectorsUI.insertAdjacentHTML("beforeend", `
            <div class="inserted-obj">
                ${vec.name} (${type}) <br>
                <input type="number" min="1" data-id="${vec.id}" class="vector-input input-dec" value="1">
            </div>
        `);
    })
}

function fillStrings() {
    stringsUI.innerHTML = "";

    if (strings.length > 0) {
        stringsUI.insertAdjacentHTML("beforeend",
            `<div class="field-desc">Enter the max length of each String</div>`
        );
    }

    strings.forEach(str => {
        stringsUI.insertAdjacentHTML("beforeend", `
            <div class="inserted-obj">
                ${str.name} <br>
                <input type="number" min="0" data-id="${str.id}" data-type="${str.type}" class="string-input input-dec" value="0">
            </div>
        `);
    })
}

function pushInCustomVectors(name, type, id, uid) {
    customVectorsUI.insertAdjacentHTML("beforeend", `
        <div class="inserted-obj e-${uid}">
            ${name} (${type}) <br>
            <input type="number" min="1" class="custom-vector-input input-dec" id="${id}" value="1">
        </div>
    `);
}

function pushInCustomStrings(name, type, id, uid) {
    customStringsUI.insertAdjacentHTML("beforeend", `
        <div class="inserted-obj e-${uid}">
            ${name} (${type}) <br>
            <input type="number" min="0" class="custom-string-input input-dec" id="${id}" value="0">
        </div>
    `);
}

function calcSpace() {
    result.innerHTML = '';

    let calculated = spaces.map(obj => {
        if (obj.isDouble) {
            obj.space = 4 + (obj.doubleDetails.space * obj.doubleDetails.multiplier);
        }

        if (obj.isVector) {
            return 4 + (obj.space * obj.multiplier);
        } else {
            return (obj.space * obj.multiplier);
        }

    }); 

    let c = 0;
    result.insertAdjacentHTML('beforeEnd', `
        <div>Total Space: <strong>${8 + calculated.reduce((a, b) => a+b,c)}</strong></div>
    `);

    result.insertAdjacentHTML('beforeEnd', `
        <div>Field-wise space: <strong>8 + ${calculated.join(" + ")}</strong></div>
    `);

    let outputCode = `impl ${stateName} {
    pub const MAX_SIZE: usize = 8 + // discriminator`;

    spaces.forEach((item, i) => {
        outputCode = outputCode.concat(`
                                ${
            item.isDouble ? `4 + ${item.multiplier} * (4 + (${item.doubleDetails.multiplier} * ${item.doubleDetails.space}))` 
            : item.isVector ? `4 + (${item.multiplier} * ${item.space})`
            : item.isOption ? `1 + ${item.space - 1}`
            : item.space
        } ${i === spaces.length - 1 ? ";" : " + "} // ${item.name}`);
    });

    outputCode = outputCode.concat(`
}`);

    outputCodeUI.value = outputCode;
}

vectorsUI.addEventListener("input", e => {
    if (e.target.closest(".vector-input")) {
        const id = e.target.dataset.id;

        if (id.includes("A")) {
            spaces[parseInt(id)].doubleDetails.multiplier = parseInt(e.target.value) ? parseInt(e.target.value) : 1;
        } else {
            spaces[parseInt(id)].multiplier = parseInt(e.target.value) ? parseInt(e.target.value) : 1;
        }
        
        calcSpace()
    }
});

stringsUI.addEventListener("input", e => {
    if (e.target.closest(".string-input")) {
        const id = e.target.dataset.id;
        const isOption = e.target.dataset.type === "option";

        if (id.includes("A")) {
            spaces[parseInt(id)].doubleDetails.space = parseInt(e.target.value) ? 4 + parseInt(e.target.value) : 0;
        } else {
            if (isOption) {
                spaces[parseInt(id)].space = parseInt(e.target.value) ? 5 + parseInt(e.target.value) : 0;
            } else {
                spaces[parseInt(id)].space = parseInt(e.target.value) ? 4 + parseInt(e.target.value) : 0;
            }
        }
        
        calcSpace()
    }
});

customTypesUI.addEventListener("change", e => {
    if (e.target.matches(".input-type")) {
        let selection = e.target.value;
        let id = e.target.dataset.id;
        let name = e.target.dataset.name;

        const inputDiv = e.target.closest(".input-div");
        inputDiv.innerHTML = "";

        if (selection === "enum") {
            inputDiv.insertAdjacentHTML("beforeEnd", `
                <label class="custom-heading">Largest variant of ${name}</label><br>
                <textarea cols="8" class="custom-input enum-input" data-id="${id}" data-type="enum"
                    data-cid=${customSpace.length}
                    placeholder="example: 
AddOwner {owner: Pubkey, code: u8} 
"
                ></textarea>
            `);

            customSpace.push({parentId: id, fields: [], type: 0});

        } else if (selection === "struct") {
            inputDiv.insertAdjacentHTML("beforeEnd", `
            <label class="custom-heading">Paste ${name} struct</label><br>
                <textarea class="custom-input struct-input" data-id="${id}" data-type="struct"
                data-cid=${customSpace.length}
                placeholder="example: 
pub struct Stratum { 
    pub owners: Vec<Pubkey>, 
    pub id: u16, 
    pub active: bool
}"
                ></textarea>
            `);

            customSpace.push({parentId: id, fields: [], type: 1})
        }
    }
});

customTypesUI.addEventListener("input", e => {
    if (e.target.matches(".custom-input")) {
        const type = e.target.dataset.type;
        const cid = e.target.dataset.cid;
        const pid = e.target.dataset.id;

        const value = e.target.value;

        if (type === "enum") {
            calculateEnumSpace(value, cid, pid);
        } else if (type === "struct") {
            calculateStructSpace(value, cid, pid);
        }
    }
});

customVectorsUI.addEventListener("input", e => {
    if(e.target.matches(".custom-vector-input")) {
        let [pid, cid, index] = e.target.id.split("-");
        customSpace[cid].fields[index].multiplier = Math.abs(parseInt(e.target.value));
        calcCustomSpace(cid); 
    }
});

customStringsUI.addEventListener("input", e => {
    if(e.target.matches(".custom-string-input")) {
        let [pid, cid, index] = e.target.id.split("-");
        customSpace[cid].fields[index].value = Math.abs(parseInt(e.target.value)) + 4;
        calcCustomSpace(cid); 
    }
});