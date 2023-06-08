const primitives = ["bool", "u8", "i8", "u16", "i16", "u32", "i32", "u64", "i64", "u128", "i128",
    "Pubkey", "f32", "f64"];

const pValue = [1,1,1,2,2,4,4,8,8,16,16,32,4,8];

// Enums

const calculateEnumSpace = (code, cid, pid) => {
    // remove existing elements of the given custom type
    customSpace[cid].fields = [];
    const targetClass = `.e-${pid}-${cid}`;
    document.querySelectorAll(targetClass).forEach(e => e.remove());

    let choice = code.trim();
    
    if (choice.includes("{")) {
        choice = choice.split("{")[1].split(",");
        
        choice.forEach((cType, index) => {
            let ccType = cType.replace("}", "").trim();

            ccType = ccType.split(":")

            if (ccType.length > 1) {
                let vType = ccType[1].trim();
                let name = ccType[0].trim();

                name = name.substring(name.lastIndexOf(" "), name.length).trim();

                if (primitives.includes(vType)) {
                    customSpace[cid].fields.push({
                        index,
                        value: pValue[primitives.indexOf(vType)],
                        multiplier: 1,
                        string: false, vector: false
                    })
                } else if (vType === "String") {
                    customSpace[cid].fields.push({
                        index,
                        value: 0,
                        multiplier: 1,
                        string: true, vector: false
                    });

                    pushInCustomStrings(name, vType, `${pid}-${cid}-${index}`, `${pid}-${cid}`);
                }
            }
        });
    }

    calcCustomSpace(cid)
}

// Structs
const calculateStructSpace = (input, cid, pid) => {
    // remove existing elements of the given custom type
    customSpace[cid].fields = [];
    const targetClass = `.e-${pid}-${cid}`;
    document.querySelectorAll(targetClass).forEach(e => e.remove());
    let code = input.split("{");

    if (code.length > 1) {
        code = code[1].split(",");

        code.forEach((field,index) => {
            if (!field.includes(":")) {
                return;
            }

            let [name, type] = field.split(":");

            name = name.trim();
            name = name.substring(name.lastIndexOf(" "), name.length).trim();
            
            type = type.replace("}", "").trim();

            if (primitives.includes(type)) {
                // primitives
                customSpace[cid].fields.push({
                    index,
                    value: pValue[primitives.indexOf(type)],
                    multiplier: 1,
                    string: false, vector: false
                });

            } else if (type.includes("Vec")) {
                // vector
                let pType = type.split("<");
                pType = pType[1].replace(">", "").trim();

                if (primitives.includes(pType)) {
                    // vec of primitives
                    customSpace[cid].fields.push({
                        index,
                        value: pValue[primitives.indexOf(pType)],
                        multiplier: 1,
                        string: false, vector: true
                    });

                    pushInCustomVectors(name, pType, `${pid}-${cid}-${index}`, `${pid}-${cid}`);

                } else if (pType === "String") {
                    // vec of strings
                    customSpace[cid].fields.push({
                        index,
                        value: 0,
                        multiplier: 1,
                        string: true, vector: true
                    });

                    pushInCustomStrings(name, pType, `${pid}-${cid}-${index}`, `${pid}-${cid}`);
                    pushInCustomVectors(name, pType, `${pid}-${cid}-${index}`, `${pid}-${cid}`);

                }

            } else if (type === "String") {
                // string
                customSpace[cid].fields.push({
                    index,
                    value: 0,
                    multiplier: 1,
                    string: true, vector: false
                });

                pushInCustomStrings(name, type, `${pid}-${cid}-${index}`, `${pid}-${cid}`);
            }
        })
    }

    calcCustomSpace(cid)
}

function calcCustomSpace(cid) {
    let space = customSpace[cid].fields.map(f => {
        if (f.vector) {
            return 4 + (f.value * f.multiplier);
        } else {
            return (f.value * f.multiplier);   
        }
    })

    const pid = customSpace[cid].parentId;

    const initValue = 0;
    spaces[pid].space = space.reduce((a,b) => a + b, initValue);

    if (customSpace[cid].type === 0) {
        spaces[pid].space += 1;
    }

    calcSpace()
}