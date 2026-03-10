const API = "http://localhost:8000"

export async function login(data) {

    const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })

    return res.json()

}

export async function createPolicy(data) {

    const res = await fetch(`${API}/create-policy`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })

    return res.json()

}

export async function signPolicy(data) {

    const res = await fetch(`${API}/sign-policy`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })

    return res.json()

}

export async function verifyPolicy(policy) {

    const res = await fetch(`${API}/verify-policy`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy })
    })

    return res.json()

}