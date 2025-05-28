const cryptoTableBody = document.querySelector("#cryptoTable tbody");
const walletsContainer = document.getElementById("walletsContainer");

let cryptos = [];
let wallets = JSON.parse(localStorage.getItem('wallets')) || [];

function formatNumber(num) {
  return num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

async function fetchCryptos() {
  cryptoTableBody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false");
    cryptos = await res.json();
    displayCryptos();
  } catch(e) {
    cryptoTableBody.innerHTML = "<tr><td colspan='4'>Failed to fetch data.</td></tr>";
  }
}

function displayCryptos() {
  cryptoTableBody.innerHTML = "";
  cryptos.forEach(c => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${c.name}</td>
      <td>${c.symbol.toUpperCase()}</td>
      <td>$${formatNumber(c.current_price)}</td>
      <td>$${formatNumber(c.market_cap)}</td>
    `;
    cryptoTableBody.appendChild(row);
  });
}

function createWalletUI(wallet) {
  const div = document.createElement("div");
  div.className = "wallet";
  div.dataset.name = wallet.name;

  let holdingsHTML = `<h3>${wallet.name}</h3>`;
  holdingsHTML += `<table><thead><tr><th>Crypto</th><th>Amount</th><th>Value (USD)</th><th>Actions</th></tr></thead><tbody>`;

  wallet.holdings.forEach(h => {
    const crypto = cryptos.find(c => c.symbol === h.symbol);
    const price = crypto ? crypto.current_price : 0;
    holdingsHTML += `
      <tr>
        <td>${h.symbol.toUpperCase()}</td>
        <td>${h.amount}</td>
        <td>$${formatNumber(h.amount * price)}</td>
        <td><button class="removeCryptoBtn" data-symbol="${h.symbol}">Remove</button></td>
      </tr>
    `;
  });

  holdingsHTML += `</tbody></table>`;

  holdingsHTML += `
    <div>
      <select class="cryptoSelect">
        <option value="">Select crypto</option>
        ${cryptos.map(c => `<option value="${c.symbol}">${c.name} (${c.symbol.toUpperCase()})</option>`).join('')}
      </select>
      <input type="number" min="0" step="any" class="cryptoAmount" placeholder="Amount" />
      <button class="addCryptoBtn">Add Crypto</button>
    </div>
  `;

  div.innerHTML = holdingsHTML;
  walletsContainer.appendChild(div);

  div.querySelector(".addCryptoBtn").onclick = () => {
    const symbol = div.querySelector(".cryptoSelect").value;
    const amount = parseFloat(div.querySelector(".cryptoAmount").value);
    if (!symbol || isNaN(amount) || amount <= 0) {
      alert("Please select a crypto and enter a valid amount.");
      return;
    }
    addCryptoToWallet(wallet.name, symbol, amount);
  };

  div.querySelectorAll(".removeCryptoBtn").forEach(btn => {
    btn.onclick = () => {
      const sym = btn.dataset.symbol;
      removeCryptoFromWallet(wallet.name, sym);
    };
  });
}

function addCryptoToWallet(walletName, symbol, amount) {
  const wallet = wallets.find(w => w.name === walletName);
  if (!wallet) return;
  const holding = wallet.holdings.find(h => h.symbol === symbol);
  if (holding) {
    holding.amount += amount;
  } else {
    wallet.holdings.push({symbol, amount});
  }
  saveWallets();
  refreshWalletsUI();
}

function removeCryptoFromWallet(walletName, symbol) {
  const wallet = wallets.find(w => w.name === walletName);
  if (!wallet) return;
  wallet.holdings = wallet.holdings.filter(h => h.symbol !== symbol);
  saveWallets();
  refreshWalletsUI();
}

function saveWallets() {
  localStorage.setItem('wallets', JSON.stringify(wallets));
}

function refreshWalletsUI() {
  walletsContainer.innerHTML = "";
  wallets.forEach(createWalletUI);
}

document.getElementById("fetchBtn").onclick = fetchCryptos;

document.getElementById("createWalletBtn").onclick = () => {
  const nameInput = document.getElementById("walletName");
  const name = nameInput.value.trim();
  if (!name) {
    alert("Enter a wallet name.");
    return;
  }
  if (wallets.find(w => w.name === name)) {
    alert("Wallet name already exists.");
    return;
  }
  wallets.push({name, holdings: []});
  saveWallets();
  refreshWalletsUI();
  nameInput.value = "";
};

fetchCryptos().then(refreshWalletsUI);
