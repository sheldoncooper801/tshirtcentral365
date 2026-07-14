def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["app"] == "T-Shirt Central 365"
    assert "checks" in data


async def test_register_success(client):
    resp = await client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "password": "securepass123",
        "full_name": "New User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == "seller"


async def test_register_duplicate_email(client, test_user):
    resp = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "securepass123",
        "full_name": "Duplicate",
    })
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"]


async def test_register_short_password(client):
    resp = await client.post("/api/auth/register", json={
        "email": "short@example.com",
        "password": "123",
        "full_name": "Short Pass",
    })
    assert resp.status_code == 422


async def test_login_success(client, test_user):
    resp = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


async def test_login_wrong_password(client, test_user):
    resp = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


async def test_login_nonexistent_user(client):
    resp = await client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "anything123",
    })
    assert resp.status_code == 401


async def test_get_me(client, test_user, auth_token):
    resp = await client.get("/api/auth/me", headers=auth_header(auth_token))
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


async def test_get_me_no_token(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401


async def test_update_me(client, test_user, auth_token):
    resp = await client.put(
        "/api/auth/me",
        json={"full_name": "Updated Name"},
        headers=auth_header(auth_token),
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Name"


async def test_catalog_list(client):
    resp = await client.get("/api/catalog")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


async def test_catalog_search(client):
    resp = await client.get("/api/catalog?search=nonexistent12345")
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


async def test_catalog_categories(client):
    resp = await client.get("/api/catalog/categories/list")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_catalog_brands(client):
    resp = await client.get("/api/catalog/brands/list")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_payment_config(client):
    resp = await client.get("/api/payments/config")
    assert resp.status_code == 200
    data = resp.json()
    assert "square_application_id" in data
    assert "enabled" in data


async def test_products_list(client):
    resp = await client.get("/api/products")
    assert resp.status_code == 200
    data = resp.json()
    assert "products" in data


async def test_create_product_requires_auth(client):
    resp = await client.post("/api/products", json={
        "title": "Test Product",
        "description": "A test",
        "base_cost": 10.0,
        "retail_price": 25.0,
    })
    assert resp.status_code == 401


async def test_create_product(client, auth_token):
    resp = await client.post(
        "/api/products",
        json={
            "title": "Test Product",
            "description": "A test product",
            "base_cost": 10.0,
            "retail_price": 25.0,
        },
        headers=auth_header(auth_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test Product"
    assert data["retail_price"] == 25.0


async def test_my_products(client, auth_token):
    resp = await client.get("/api/products/my", headers=auth_header(auth_token))
    assert resp.status_code == 200


async def test_orders_list_requires_auth(client):
    resp = await client.get("/api/orders")
    assert resp.status_code == 401


async def test_orders_list(client, auth_token):
    resp = await client.get("/api/orders", headers=auth_header(auth_token))
    assert resp.status_code == 200
    data = resp.json()
    assert "orders" in data


async def test_webhook_no_crash(client):
    resp = await client.post("/api/payments/webhook", json={"type": "test"})
    assert resp.status_code == 200


async def test_payment_config_includes_costs(client):
    resp = await client.get("/api/payments/config")
    data = resp.json()
    assert "tax_rate" in data
    assert "shipping_cost" in data
    assert data["tax_rate"] == 0.08
    assert data["shipping_cost"] == 5.99


async def test_forgot_password(client, test_user):
    resp = await client.post("/api/auth/forgot-password", json={"email": "test@example.com"})
    assert resp.status_code == 200
    assert "reset" in resp.json()["detail"].lower() or "sent" in resp.json()["detail"].lower()


async def test_forgot_password_nonexistent(client):
    resp = await client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
    assert resp.status_code == 200


async def test_admin_users_requires_admin(client, auth_token):
    resp = await client.get("/api/auth/admin/users", headers=auth_header(auth_token))
    assert resp.status_code == 403


async def test_admin_users_requires_auth(client):
    resp = await client.get("/api/auth/admin/users")
    assert resp.status_code == 401


async def test_create_design(client, auth_token):
    resp = await client.post(
        "/api/designs",
        json={"title": "Test Design", "design_url": "/uploads/designs/test.png"},
        headers=auth_header(auth_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert data["message"] == "Design saved"


async def test_list_designs(client, auth_token):
    resp = await client.get("/api/designs", headers=auth_header(auth_token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_create_and_get_design(client, auth_token):
    create_resp = await client.post(
        "/api/designs",
        json={"title": "My Design", "design_url": "/uploads/designs/test.png"},
        headers=auth_header(auth_token),
    )
    assert create_resp.status_code == 200
    design_id = create_resp.json()["id"]

    list_resp = await client.get("/api/designs", headers=auth_header(auth_token))
    assert list_resp.status_code == 200
    designs = list_resp.json()
    assert any(d["id"] == design_id for d in designs)


async def test_update_design(client, auth_token):
    create_resp = await client.post(
        "/api/designs",
        json={"title": "Original", "design_url": "/uploads/designs/test.png"},
        headers=auth_header(auth_token),
    )
    design_id = create_resp.json()["id"]

    resp = await client.put(
        f"/api/designs/{design_id}",
        json={"title": "Updated"},
        headers=auth_header(auth_token),
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Design updated"


async def test_delete_design(client, auth_token):
    create_resp = await client.post(
        "/api/designs",
        json={"title": "To Delete", "design_url": "/uploads/designs/test.png"},
        headers=auth_header(auth_token),
    )
    design_id = create_resp.json()["id"]

    resp = await client.delete(f"/api/designs/{design_id}", headers=auth_header(auth_token))
    assert resp.status_code == 200

    list_resp = await client.get("/api/designs", headers=auth_header(auth_token))
    assert not any(d["id"] == design_id for d in list_resp.json())


async def test_create_order_requires_auth(client):
    resp = await client.post("/api/orders", json={
        "items": [{"quantity": 1, "price": 25.0, "printify_variant_id": 123}],
        "shipping_address": {"full_name": "Test", "line1": "123 Main St", "city": "Testville", "state": "CA", "postal_code": "90210", "country": "US"},
    })
    assert resp.status_code == 401


async def test_create_order_printify_item(client, auth_token):
    resp = await client.post(
        "/api/orders",
        json={
            "items": [{"quantity": 1, "price": 25.0, "printify_variant_id": 12345, "product_title": "Test Tee", "variant_title": "L / Black"}],
            "shipping_address": {"full_name": "Test User", "line1": "123 Main St", "city": "Testville", "state": "CA", "postal_code": "90210", "country": "US"},
        },
        headers=auth_header(auth_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert "order_number" in data
    assert data["subtotal"] == 25.0
    assert len(data["items"]) == 1


async def test_create_order_invalid_price(client, auth_token):
    resp = await client.post(
        "/api/orders",
        json={
            "items": [{"quantity": 1, "price": 0.50, "printify_variant_id": 12345}],
            "shipping_address": {"full_name": "Test", "line1": "123 Main St", "city": "T", "state": "CA", "postal_code": "90210", "country": "US"},
        },
        headers=auth_header(auth_token),
    )
    assert resp.status_code == 400
    assert "Invalid price" in resp.json()["detail"]


async def test_get_order_detail(client, auth_token):
    create_resp = await client.post(
        "/api/orders",
        json={
            "items": [{"quantity": 1, "price": 25.0, "printify_variant_id": 12345, "product_title": "Tee"}],
            "shipping_address": {"full_name": "Test", "line1": "123 Main St", "city": "T", "state": "CA", "postal_code": "90210", "country": "US"},
        },
        headers=auth_header(auth_token),
    )
    order_id = create_resp.json()["id"]

    resp = await client.get(f"/api/orders/{order_id}", headers=auth_header(auth_token))
    assert resp.status_code == 200
    assert resp.json()["id"] == order_id


async def test_get_order_unauthorized(client, auth_token):
    create_resp = await client.post(
        "/api/orders",
        json={
            "items": [{"quantity": 1, "price": 25.0, "printify_variant_id": 12345, "product_title": "Tee"}],
            "shipping_address": {"full_name": "Test", "line1": "123 Main St", "city": "T", "state": "CA", "postal_code": "90210", "country": "US"},
        },
        headers=auth_header(auth_token),
    )
    order_id = create_resp.json()["id"]

    import uuid
    unique_email = f"other_{uuid.uuid4().hex[:8]}@example.com"
    other_resp = await client.post("/api/auth/register", json={
        "email": unique_email, "password": "otherpass123", "full_name": "Other",
    })
    if other_resp.status_code == 429:
        return
    other_token = other_resp.json()["access_token"]

    resp = await client.get(f"/api/orders/{order_id}", headers=auth_header(other_token))
    assert resp.status_code == 403


async def test_update_order_status_requires_admin(client, auth_token):
    create_resp = await client.post(
        "/api/orders",
        json={
            "items": [{"quantity": 1, "price": 25.0, "printify_variant_id": 12345, "product_title": "Tee"}],
            "shipping_address": {"full_name": "Test", "line1": "123 Main St", "city": "T", "state": "CA", "postal_code": "90210", "country": "US"},
        },
        headers=auth_header(auth_token),
    )
    order_id = create_resp.json()["id"]

    resp = await client.put(
        f"/api/orders/{order_id}/status",
        json={"status": "shipped"},
        headers=auth_header(auth_token),
    )
    assert resp.status_code == 403


async def test_contact_form(client):
    resp = await client.post("/api/contact", json={
        "name": "Test User",
        "email": "test@example.com",
        "subject": "general",
        "message": "Hello, this is a test message.",
    })
    assert resp.status_code == 200


async def test_contact_form_requires_fields(client):
    resp = await client.post("/api/contact", json={"name": ""})
    assert resp.status_code == 422


async def test_product_get(client):
    create_resp = await client.post(
        "/api/products",
        json={"title": "Detail Test", "description": "test", "base_cost": 5.0, "retail_price": 20.0},
        headers=auth_header((await _get_token(client))),
    )
    product_id = create_resp.json()["id"]

    resp = await client.get(f"/api/products/{product_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Detail Test"


async def test_product_update(client, auth_token):
    create_resp = await client.post(
        "/api/products",
        json={"title": "To Update", "description": "test", "base_cost": 5.0, "retail_price": 20.0},
        headers=auth_header(auth_token),
    )
    product_id = create_resp.json()["id"]

    resp = await client.put(
        f"/api/products/{product_id}",
        json={"title": "Updated Product"},
        headers=auth_header(auth_token),
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated Product"


async def test_product_delete(client, auth_token):
    create_resp = await client.post(
        "/api/products",
        json={"title": "To Delete", "description": "test", "base_cost": 5.0, "retail_price": 20.0},
        headers=auth_header(auth_token),
    )
    product_id = create_resp.json()["id"]

    resp = await client.delete(f"/api/products/{product_id}", headers=auth_header(auth_token))
    assert resp.status_code == 204

    get_resp = await client.get(f"/api/products/{product_id}")
    assert get_resp.status_code == 404


async def _get_token(client):
    import uuid
    resp = await client.post("/api/auth/register", json={
        "email": f"helper_{uuid.uuid4().hex[:8]}@example.com", "password": "helperpass123", "full_name": "Helper",
    })
    if resp.status_code == 429:
        resp = await client.post("/api/auth/login", json={
            "email": "test@example.com", "password": "testpass123",
        })
    return resp.json()["access_token"]


async def test_catalog_item_not_found(client):
    resp = await client.get("/api/catalog/999999999")
    assert resp.status_code == 404
