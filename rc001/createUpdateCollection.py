import dogeturbo

API_URL = "https://turbo.ordinalswallet.com"

async def create_collection(api_secret, name, icon_inscription_id, icon, slug, active, description, inscriptions, socials):
    url = f"{API_URL}/collection/new"
    payload = {
        "api_secret": api_secret,  # Secret key for API authentication
        "name": name,  # Human-readable name of the collection
        "icon_inscription_id": icon_inscription_id,  # Inscription ID for the collection's icon
        "icon": icon,  # URL of the collection's icon
        "slug": slug,  # Unique identifier for the collection
        "active": active,  # Boolean to show/hide the collection
        "description": description,  # Description of the collection
        "inscriptions": inscriptions,  # List of inscriptions in the collection
        "socials": socials  # Social media links related to the collection
    }
    response = await dogeturbo.post(url, json=payload)
    return response.json()

async def update_collection(api_secret, slug, name=None, icon_inscription_id=None, icon=None, active=None, description=None, inscriptions=None, socials=None, remove_icon_inscription_id=None, new_inscription_ids=None, new_inscriptions=None):
    url = f"{API_URL}/collection/update"
    payload = {
        "api_secret": api_secret,  # Secret key for API authentication
        "slug": slug  # Unique identifier for the collection
    }
    
    # Add optional parameters if they are provided
    if name is not None:
        payload["name"] = name  # Update collection name
    if icon_inscription_id is not None:
        payload["icon_inscription_id"] = icon_inscription_id  # Update icon inscription ID
    if icon is not None:
        payload["icon"] = icon  # Update icon URL
    if active is not None:
        payload["active"] = active  # Update active status
    if description is not None:
        payload["description"] = description  # Update description
    if inscriptions is not None:
        payload["inscriptions"] = inscriptions  # Update inscriptions list
    if socials is not None:
        payload["socials"] = socials  # Update social links
    if remove_icon_inscription_id is not None:
        payload["remove_icon_inscription_id"] = remove_icon_inscription_id  # Remove icon inscription ID
    if new_inscription_ids is not None:
        payload["new_inscription_ids"] = new_inscription_ids  # Add new inscription IDs
    if new_inscriptions is not None:
        payload["new_inscriptions"] = new_inscriptions  # Add new inscriptions with metadata

    response = await dogeturbo.post(url, json=payload)
    return response.json()

# Example usage:
async def main():
    # Required parameters for creating a collection
    api_secret = "your_api_secret"  # Example: "my_secret_key"
    name = "My Collection"  # Example: "Art Collection"
    icon_inscription_id = "icon_inscription_id"  # Example: "12345"
    icon = "https://example.com/icon.png"  # Example: "https://example.com/icon.png"
    slug = "my-collection"  # Example: "art-collection"
    active = True  # Example: True
    description = "This is a description of my collection."  # Example: "A collection of digital art."
    inscriptions = [{"id": "inscription_id_1"}, {"id": "inscription_id_2"}]  # Example: [{"id": "abc123"}, {"id": "def456"}]
    socials = {"twitter": "https://twitter.com/mycollection", "discord": "https://discord.gg/mycollection", "website": "https://mycollection.com"}  # Example: {"twitter": "https://twitter.com/art", "discord": "https://discord.gg/art", "website": "https://art.com"}

    # Create a new collection
    create_response = await create_collection(api_secret, name, icon_inscription_id, icon, slug, active, description, inscriptions, socials)
    print("Create Response:", create_response)

    # Optional parameters for updating a collection
    update_name = "Updated Collection Name"  # Example: "Updated Art Collection"
    update_icon_inscription_id = "new_icon_inscription_id"  # Example: "67890"
    update_icon = "https://example.com/new_icon.png"  # Example: "https://example.com/new_icon.png"
    update_active = False  # Example: False
    update_description = "Updated description of my collection."  # Example: "An updated collection of digital art."
    update_inscriptions = [{"id": "inscription_id_3"}, {"id": "inscription_id_4"}]  # Example: [{"id": "ghi789"}, {"id": "jkl012"}]
    update_socials = {"twitter": "https://twitter.com/updatedcollection", "discord": "https://discord.gg/updatedcollection", "website": "https://updatedcollection.com"}  # Example: {"twitter": "https://twitter.com/updatedart", "discord": "https://discord.gg/updatedart", "website": "https://updatedart.com"}
    remove_icon = True  # Example: True
    new_inscription_ids = ["new_inscription_id_1", "new_inscription_id_2"]  # Example: ["mno345", "pqr678"]
    new_inscriptions = [{"id": "new_inscription_id_3", "meta": {"name": "New Inscription", "attributes": [{"trait_type": "Color", "value": "Blue"}]}}]  # Example: [{"id": "stu901", "meta": {"name": "New Art", "attributes": [{"trait_type": "Style", "value": "Abstract"}]}}]

    # Update the collection
    update_response = await update_collection(
        api_secret,
        slug,
        name=update_name,
        icon_inscription_id=update_icon_inscription_id,
        icon=update_icon,
        active=update_active,
        description=update_description,
        inscriptions=update_inscriptions,
        socials=update_socials,
        remove_icon_inscription_id=remove_icon,
        new_inscription_ids=new_inscription_ids,
        new_inscriptions=new_inscriptions
    )
    print("Update Response:", update_response)

# Run the main function
import asyncio
asyncio.run(main())
