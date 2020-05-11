if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else {
    ready()
}

function ready() {
    const removeCartItemButtons = document.getElementsByClassName('btn-danger')
    for (let i = 0; i < removeCartItemButtons.length; i++) {
        let button = removeCartItemButtons[i]
        button.addEventListener('click', removeCartItem)
    }

    const quantityInputs = document.getElementsByClassName('cart-quantity-input')
    for (let i = 0; i < quantityInputs.length; i++) {
        let input = quantityInputs[i]
        input.addEventListener('change', quantityChanged)
    }

    const addToCartButtons = document.getElementsByClassName('shop-item-button')
    for (let i = 0; i < addToCartButtons.length; i++) {
        let button = addToCartButtons[i]
        button.addEventListener('click', addToCartClicked)
    }

    document.getElementsByClassName('btn-purchase')[0].addEventListener('click',
    purchaseClicked)
}

let stripeHandler = StripeCheckout.configure({
    key: stripePublicKey,
    locale: 'auto',
    token: function(token) {
        let items = []
        let cartItemContainer = document.getElementsByClassName('cart-items')[0]
        let cartRows = cartItemContainer.getElementsByClassName('cart-row')
        for (let i = 0; i < cartRows.length; i++) {
            let cartRow = cartRows[i]
            let quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
            let quantity = quantityElement.value
            let id = cartRow.dataset.itemId
            items.push({
                id: id,
                quantity: quantity
            })
        }

        fetch('/compra', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                stripeTokenId: token.id,
                items: items
            })
        }).then(function(res) {
            return res.json()
        }).then(function(data) {
            alert(data.message)
            let cartItems = document.getElementsByClassName('cart-items')[0]
            while (cartItems.hasChildNodes()) {
                cartItems.removeChild(cartItems.firstChild)
            }
            updateCartTotal()
        }).catch(function(error) {
            console.error(error)
        })
    }
})

function purchaseClicked() {
    let priceElement = document.getElementsByClassName('cart-total-price')[0]
    let price = parseFloat(priceElement.innerText.replace('$', '')) * 100
    stripeHandler.open({
        amount: price
    })
}

function quantityChanged(e) {
    let input = e.target
    if (isNaN(input.value) || input.value <= 0) {
        input.value = 1
    }
    updateCartTotal()
}

function addToCartClicked(e) {
    let button = e.target
    let shopItem = button.parentElement.parentElement
    let title = shopItem.getElementsByClassName('shop-item-title')[0].innerText
    let price = shopItem.getElementsByClassName('shop-item-price')[0].innerText
    let imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src
    let id = shopItem.dataset.itemId
    addItemToCart(title, price, imageSrc, id)
    updateCartTotal()
}

function addItemToCart(title, price, imageSrc, id) {
    let cartRow = document.createElement('div')
    cartRow.classList.add('cart-row')
    cartRow.dataset.itemId = id
    let cartItems = document.getElementsByClassName('cart-items')[0]
    let cartItemsNames = cartItems.getElementsByClassName('cart-item-title')
    for (let i = 0; i < cartItemsNames.length; i++) {
        if (cartItemsNames[i].innerText == title) {
            alert('Este item ya se encuentra en el carrito de compras')
            return
        }
    }
    let cartRowContents = `  
        <div class="cart-item cart-column">
            <img class="cart-item-image" src="${imageSrc}" width="100" height="100">
            <span class="cart-item-title">${title}</span>
        </div>
        <span class="cart-price cart-column">${price}</span>
        <div class="cart-quantity cart-column">
            <input class="cart-quantity-input" type="number" value="1">
            <button class="btn btn-danger" role="button">REMOVER</button>
        </div>`
    cartRow.innerHTML = cartRowContents
    cartItems.append(cartRow)
    // Event listeners need to be added again as these elements were not 
    // loaded when our JS did
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener
    ('click', removeCartItem)
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener
    ('change', quantityChanged)
}

function removeCartItem(e) {
    let buttonClicked = e.target
    buttonClicked.parentElement.parentElement.remove()
    updateCartTotal()
}

function updateCartTotal() {
    let cartItemContainer = document.getElementsByClassName('cart-items')[0]
    let cartRows = cartItemContainer.getElementsByClassName('cart-row')
    let total = 0
    for (let i = 0; i < cartRows.length; i++) {
        let cartRow = cartRows[i]
        let priceElement = cartRow.getElementsByClassName('cart-price')[0]
        let quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
        // parseFloat converts the string into a float
        let price = parseFloat(priceElement.innerText.replace('$', ''))
        let quantity = quantityElement.value
        total = total + (price * quantity)
    }
    // Round to two decimal places
    total = Math.round(total * 100) / 100;
    document.getElementsByClassName('cart-total-price')[0].innerText = 
    (total % 1 === 0) ? `$${total}.00`: `$${total}`;
}