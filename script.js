document.querySelector('.menu-toggle').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('show');
});


document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('searchInput').value.trim();
  const resultsDiv = document.getElementById('results');

  if (query === '') {
    resultsDiv.innerHTML = `<p>Please enter a chemical name!</p>`;
    return;
  }

  resultsDiv.innerHTML = `<p>Searching PubChem for <strong>${query}</strong>... 🔍</p>`;

  fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/JSON`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      return response.json();
    })
    .then(data => {
      console.log(JSON.stringify(data, null, 2)); // For you to see the full response in console!

      const compound = data.PC_Compounds?.[0];
      if (!compound) {
        resultsDiv.innerHTML = `<p>No data found for "${query}". 🫥</p>`;
        return;
      }

      const props = compound.props || [];
      const molecularFormula = props.find(p => p.urn.label === 'Molecular Formula')?.value?.sval || 'N/A';
      const iupac = props.find(p => p.urn.label === 'IUPAC Name')?.value?.sval || 'N/A';
      const molWeight = props.find(p => p.urn.label === 'Molecular Weight')?.value?.sval || 'N/A';
      const boilingPoint = props.find(p => p.urn.label === 'Boiling Point')?.value?.sval || 'N/A';

      resultsDiv.innerHTML = `
        <h2>${query}</h2>
        <p><strong>Formula:</strong> ${molecularFormula}</p>
        <p><strong>IUPAC Name:</strong> ${iupac}</p>
        <p><strong>Molecular Weight:</strong> ${molWeight}</p>
        <p><strong>Boiling Point:</strong> ${boilingPoint}</p>
        <img src="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.id.id.cid}/PNG" alt="Structure of ${query}">

        <p><em>More details coming soon! ✨</em></p>
        <a href="https://pubchem.ncbi.nlm.nih.gov/compound/${compound.id.id.cid}" target="_blank">View on PubChem 🔗</a>
      `;
    })
    .catch(error => {
      console.error(error);
      resultsDiv.innerHTML = `<p>Oops! Something went wrong. 🧯</p>`;
    });
});

// Camera search logic
const cameraBtn = document.getElementById('cameraBtn');
const imageInput = document.getElementById('imageInput');
const resultsDiv = document.getElementById('results');

