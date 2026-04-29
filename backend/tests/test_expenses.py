async def test_create_expense_success(client):
    response = await client.post(
        "/expenses",
        json={
            "amount": "120.50",
            "category": "Food",
            "description": "Lunch",
            "date": "2026-04-29",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["amount"] == "120.50"
    assert body["category"] == "Food"
    assert body["description"] == "Lunch"


async def test_idempotency_same_key_returns_same_expense(client):
    headers = {"Idempotency-Key": "a6d2d557-c940-4bcc-86af-ebd04d8b4685"}
    payload = {
        "amount": "250.00",
        "category": "Transport",
        "description": "Metro pass",
        "date": "2026-04-29",
    }

    first = await client.post("/expenses", json=payload, headers=headers)
    second = await client.post("/expenses", json=payload, headers=headers)

    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]


async def test_negative_amount_rejected(client):
    response = await client.post(
        "/expenses",
        json={
            "amount": "-1.00",
            "category": "Other",
            "description": "Invalid",
            "date": "2026-04-29",
        },
    )

    assert response.status_code == 400
    body = response.json()
    assert body["error"]["code"] == "validation_error"


async def test_filter_by_category(client):
    await client.post(
        "/expenses",
        json={
            "amount": "50.00",
            "category": "Food",
            "description": "Breakfast",
            "date": "2026-04-29",
        },
    )
    await client.post(
        "/expenses",
        json={
            "amount": "75.00",
            "category": "Transport",
            "description": "Cab",
            "date": "2026-04-28",
        },
    )

    response = await client.get("/expenses", params={"category": "Food"})

    assert response.status_code == 200
    body = response.json()
    assert len(body["expenses"]) == 1
    assert body["expenses"][0]["category"] == "Food"


async def test_total_computed_correctly(client):
    await client.post(
        "/expenses",
        json={
            "amount": "10.10",
            "category": "Food",
            "description": "Snack",
            "date": "2026-04-29",
        },
    )
    await client.post(
        "/expenses",
        json={
            "amount": "20.20",
            "category": "Food",
            "description": "Dinner",
            "date": "2026-04-28",
        },
    )

    response = await client.get("/expenses", params={"category": "Food"})

    assert response.status_code == 200
    assert response.json()["total"] == "30.30"
