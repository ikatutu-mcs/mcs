// script.js

// === Rate Configuration ===
const RATE_CONFIG = {
  cleanerRate: 30,
  commercialRateIncrease: 15,
  timePerBedroom: 0.50,
  timePerBathroom: 0.60,
  timeForKitchen: 0.50,
  timeForLivingRoom: 0.50,
  timeForPets: 0.45,
  serviceTaxRate: 0.0,
  frequencyModifiers: {
    light: 0.8,// 20% off for light cleanings 80% of the original price
    deep: 1.2, // add 20% of the original price for deep cleanings
    recurring: 1.0 // remain the same original Price, the price will be adjusted on recurringDiscounts:
  },
  extrasMap: {
    'Outside windows': 0.5,
    'Window wells': 0.5,
    'Garage': 1,
    'Carpet cleaning': 1,
    'Inside oven': 0.5,
    'Baseboard cleaning': 0.75,
    'Laundry': 0.5
  },
  defaultBuildingType: 'Residential',
  recurringDiscounts: {
    1: 0.10,
    2: 0.40,
    3: 0.50,
    4: 0.60
  },
  expensePercentages: {
    travelTransportation: 0.05,
    insurance: 0.10,
    cleaningProducts: 0.30,
    marketing: 0.10,
    accountingLegal: 0.10,
    softwareWebsite: 0.05,
    equipmentMaintenance: 0.05,
    transactionFees: 0.03,
    bankFees: 0.03,
    officeRental: 0.14
  },
  profitMargin: 0.10,
  laborRates: {
    default: 20,
    light: 15,
    deep: 25
  }
};

const FORMSPREE_URL = 'https://formspree.io/f/xanopboz';

function calculateEstimate({ // Function to calculate the estimate based on user inputs
  // Default values for the parameters
  // These values can be overridden by the user inputs 
  bedrooms = 0, // Select 
  bathrooms = 0, // Select
  hasKitchen = false, // is not checked 
  hasLivingRoom = false, // is not checked 
  hasPets = false, // is not checked 
  buildingType = RATE_CONFIG.defaultBuildingType, // Residential will be selected by default 
  oneTimeType = null,
  monthlyCleanings = 0,
  extras = [],
  travelCost = 0,
  numberOfCleaners = 1,// The number of cleaners can be changed by the user. The default value is 1 
  discountPercentage = 0
}) {
  let cleanerRate = RATE_CONFIG.cleanerRate; // Default cleaner rate 
  let hours = 0; // Total hours needed for cleaning 
  let taxTotal = 0;
  let price = 0;
  let baseSubtotal = 0;

  if (buildingType === 'Commercial') cleanerRate += RATE_CONFIG.commercialRateIncrease; // Increase the rate for commercial buildings 

  function addItem(hoursCount) {
    const price = hoursCount * cleanerRate * numberOfCleaners; // Calculate the price based on the hours and cleaner rate 
    const taxedPrice = price * RATE_CONFIG.serviceTaxRate;
    taxTotal += taxedPrice;
    baseSubtotal += price;
    return price + taxedPrice;
  }

  hours += bedrooms * RATE_CONFIG.timePerBedroom;
  price += addItem(bedrooms * RATE_CONFIG.timePerBedroom);

  const wholeBathrooms = Math.floor(bathrooms);
  const hasHalfBathroom = bathrooms - wholeBathrooms >= 0.5;
  hours += wholeBathrooms * RATE_CONFIG.timePerBathroom;
  if (hasHalfBathroom) hours += (RATE_CONFIG.timePerBathroom * 0.5);
  price += addItem(wholeBathrooms * RATE_CONFIG.timePerBathroom);
  if (hasHalfBathroom) price += addItem(RATE_CONFIG.timePerBathroom * 0.5);

  if (hasKitchen) {
    hours += RATE_CONFIG.timeForKitchen;
    price += addItem(RATE_CONFIG.timeForKitchen);
  }
  if (hasLivingRoom) {
    hours += RATE_CONFIG.timeForLivingRoom;
    price += addItem(RATE_CONFIG.timeForLivingRoom);
  }
  if (hasPets) {
    hours += RATE_CONFIG.timeForPets;
    price += addItem(RATE_CONFIG.timeForPets);
  }

  extras.forEach(item => {
    if (RATE_CONFIG.extrasMap.hasOwnProperty(item)) {
      hours += RATE_CONFIG.extrasMap[item];
      price += addItem(RATE_CONFIG.extrasMap[item]);
    }
  });

  price += travelCost;
  taxTotal += travelCost * RATE_CONFIG.serviceTaxRate;
  price += travelCost * RATE_CONFIG.serviceTaxRate;
  baseSubtotal += travelCost;

  // Apply frequency modifier
  let frequencyModifier = 1.0;
  if (monthlyCleanings > 0) {
    frequencyModifier = RATE_CONFIG.frequencyModifiers.recurring;
  } else if (oneTimeType === 'light') {
    frequencyModifier = RATE_CONFIG.frequencyModifiers.light;
  } else if (oneTimeType === 'deep') {
    frequencyModifier = RATE_CONFIG.frequencyModifiers.deep;
  }
  price *= frequencyModifier;
  baseSubtotal *= frequencyModifier;

  let recurringDiscount = 0;
  if (monthlyCleanings > 0) {
    const discountRate = RATE_CONFIG.recurringDiscounts[monthlyCleanings] || RATE_CONFIG.recurringDiscounts[4];
    recurringDiscount = baseSubtotal * discountRate;
  }

  const additionalDiscount = baseSubtotal * (discountPercentage / 100);
  const totalDiscount = recurringDiscount + additionalDiscount;
  price -= totalDiscount;

  const adjustedHours = hours / numberOfCleaners;

  return {
    estimatedHours: Math.round(adjustedHours * 10) / 10,               // Round to 1 decimal place
    estimatedPrice: Math.round(price * 100) / 100,                     // Round to 2 decimal places
    subtotal: Math.round(baseSubtotal * 100) / 100,                    // Round to 2 decimal places
    tax: Math.round(taxTotal * 100) / 100,                             // Round to 2 decimal places
    recurringDiscount: Math.round(recurringDiscount * 100) / 100,      // Round to 2 decimal places
    additionalDiscount: Math.round(additionalDiscount * 100) / 100     // Round to 2 decimal places
  };
}

// DOM interaction logic
document.addEventListener('DOMContentLoaded', function () {
  const estimateBox = document.querySelector('.estimate-box'); // Select the estimate box
  const estimateBoxStrong = document.querySelector('.estimate-box strong'); // Select the strong element inside the estimate box
  const subtotalLine = document.querySelector('.estimate-box p:nth-child(2)'); // Select the second item inside the estimate box
  const estimateTime = document.querySelector('.estimate-box p:nth-child(3)'); // Select the third item inside the estimate box
  const totalEstimateLine = document.querySelector('.estimate-box p:nth-child(4)'); // Select the fourth item inside the estimate box
  const showBreakdownButton = document.getElementById('show-breakdown'); // Select the button to show/hide the cost breakdown
  const costBreakdownDiv = document.getElementById('cost-breakdown'); // Select the cost breakdown div 

  const oneTimeCheckbox = document.getElementById('oneTimeCheckbox'); // Select the one-time checkbox
  const oneTimeOptions = document.getElementById('oneTimeOptions'); // Select the one-time options div
  const monthlyCheckbox = document.getElementById('monthlyCheckbox'); // Select the monthly checkbox
  const monthlyCount = document.getElementById('monthlyCount'); // Select the monthly count input

  oneTimeCheckbox.addEventListener('change', function () {
    oneTimeOptions.style.display = this.checked ? 'block' : 'none';
    oneTimeOptions.setAttribute('aria-hidden', this.checked ? 'false' : 'true');
    if (this.checked) {
      monthlyCheckbox.checked = false; // Uncheck the monthly checkbox
      monthlyCount.disabled = true; // Disable the monthly count input
      monthlyCount.value = '0'; // Reset the monthly count input
      document.querySelector('input[name="oneTimeType"][value="light"]').checked = true; // Check the light cleaning option by default 
    }
    updateEstimate();
  });

  monthlyCheckbox.addEventListener('change', function () { // Handle the monthly checkbox change 
    monthlyCount.disabled = !this.checked; // Enable/disable the monthly count input 
    if (this.checked) { // If monthly is checked
      oneTimeCheckbox.checked = false; // Uncheck the one-time checkbox
      oneTimeOptions.style.display = 'none'; // Hide the one-time options
      oneTimeOptions.setAttribute('aria-hidden', 'true'); // Set aria-hidden to true
      document.querySelectorAll('input[name="oneTimeType"]').forEach(radio => radio.checked = false); // Uncheck all one-time type radio buttons
      monthlyCount.value = '1'; // Set the monthly count to 1
    }
    updateEstimate(); // Update the estimate 
  });

  showBreakdownButton.addEventListener('click', function () { // Handle the show/hide breakdown button click 
    const isExpanded = costBreakdownDiv.style.display === 'block'; // Check if the breakdown is currently expanded 
    costBreakdownDiv.style.display = isExpanded ? 'none' : 'block'; // Toggle the display of the breakdown
    costBreakdownDiv.setAttribute('aria-hidden', isExpanded ? 'true' : 'false'); // Set aria-hidden attribute
    this.setAttribute('aria-expanded', isExpanded ? 'false' : 'true'); // Toggle the aria-expanded attribute 
    this.textContent = isExpanded ? 'Show Cost Breakdown' : 'Hide Cost Breakdown';  // Update the button text
    // if (!isExpanded) {
    //   costBreakdownDiv.scrollIntoView({ behavior: 'smooth' }); // Scroll to the breakdown if expanded //
    // }
  });

  document.getElementById('show-light-tasks').addEventListener('click', function () {
    const lightTasks = document.getElementById('light-tasks');
    const isExpanded = lightTasks.style.display === 'block';
    lightTasks.style.display = isExpanded ? 'none' : 'block';
    lightTasks.setAttribute('aria-hidden', isExpanded ? 'true' : 'false');
    this.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
    this.textContent = isExpanded ? 'Show Tasks' : 'Hide Tasks';
  });

  document.getElementById('show-deep-tasks').addEventListener('click', function () {
    const deepTasks = document.getElementById('deep-tasks');
    const isExpanded = deepTasks.style.display === 'block';
    deepTasks.style.display = isExpanded ? 'none' : 'block';
    deepTasks.setAttribute('aria-hidden', isExpanded ? 'true' : 'false');
    this.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
    this.textContent = isExpanded ? 'Show Tasks' : 'Hide Tasks';
  });

  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', updateEstimate);
  });

  function updateEstimate() {
    const bedrooms = parseInt(document.getElementById('bedrooms').value) || 0;
    const bathrooms = parseFloat(document.getElementById('bathrooms').value) || 0;
    const buildingType = document.getElementById('buildingType').value;
    const hasKitchen = document.getElementById('kitchen').checked;
    const hasLivingRoom = document.getElementById('livingRoom').checked;
    const hasPets = document.getElementById('pets').checked;
    const numberOfCleaners = parseInt(document.getElementById('cleaners').value) || 1;
    const discountPercentage = parseInt(document.getElementById('discountOption').value) || 0;

    const oneTimeType = oneTimeCheckbox.checked
      ? document.querySelector('input[name="oneTimeType"]:checked')?.value || null
      : null;
    const monthlyCleanings = monthlyCheckbox.checked
      ? parseInt(monthlyCount.value) || 0
      : 0;

    const extras = [];
    document.querySelectorAll('.section-block:nth-of-type(3) input[type="checkbox"]').forEach(cb => {
      if (cb.checked) {
        const extra = cb.getAttribute('data-extra');
        if (extra) extras.push(extra);
      }
    });

    const travelCost = 0;
    const result = calculateEstimate({
      bedrooms,
      bathrooms,
      hasKitchen,
      hasLivingRoom,
      hasPets,
      buildingType,
      oneTimeType,
      monthlyCleanings,
      extras,
      travelCost,
      numberOfCleaners,
      discountPercentage
    });

    // Apply pulse animation
    estimateBox.classList.add('pulse');
    setTimeout(() => estimateBox.classList.remove('pulse'), 500);

    estimateBoxStrong.textContent = `$${result.estimatedPrice.toFixed(2)}`;
    subtotalLine.textContent = `Subtotal: $${result.subtotal.toFixed(2)}`;
    const totalMinutes = Math.round(result.estimatedHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    estimateTime.textContent = `Estimated Time: ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    totalEstimateLine.textContent = `Total Estimate Per Cleaning: $${result.estimatedPrice.toFixed(2)}`;

    if ((result.recurringDiscount > 0 || result.additionalDiscount > 0) && result.subtotal > 0) {
      let discountLine = document.querySelector('.estimate-box p.discount-line');
      if (!discountLine) {
        discountLine = document.createElement('p');
        discountLine.className = 'discount-line';
        totalEstimateLine.parentElement.insertBefore(discountLine, totalEstimateLine);
      }
      discountLine.innerHTML = `<i class="fa-solid fa-tag discount-icon"></i>Discount: -$${(result.recurringDiscount + result.additionalDiscount).toFixed(2)}`;
    } else if (document.querySelector('.estimate-box p.discount-line')) {
      document.querySelector('.estimate-box p.discount-line').remove();
    }

    const laborRate = monthlyCleanings > 0 ? RATE_CONFIG.laborRates.default :
                     oneTimeType === 'light' ? RATE_CONFIG.laborRates.light :
                     oneTimeType === 'deep' ? RATE_CONFIG.laborRates.deep :
                     RATE_CONFIG.laborRates.default;
    const laborCost = laborRate * result.estimatedHours * numberOfCleaners;
    const remainingAmount = result.estimatedPrice - laborCost;
    const totalExpenses = remainingAmount * 0.90;
    const profit = remainingAmount * 0.10;
    const profitBreakdown = {
      emergencySavings: profit * 0.5,
      businessGrowth: profit * 0.5
    };
    const breakdown = {
      labor: laborCost, // Labor cost
      travelTransportation: totalExpenses * RATE_CONFIG.expensePercentages.travelTransportation, // Travel & Transportation
      insurance: totalExpenses * RATE_CONFIG.expensePercentages.insurance,
      cleaningProducts: totalExpenses * RATE_CONFIG.expensePercentages.cleaningProducts,
      marketing: totalExpenses * RATE_CONFIG.expensePercentages.marketing,
      accountingLegal: totalExpenses * RATE_CONFIG.expensePercentages.accountingLegal,
      softwareWebsite: totalExpenses * RATE_CONFIG.expensePercentages.softwareWebsite,
      equipmentMaintenance: totalExpenses * RATE_CONFIG.expensePercentages.equipmentMaintenance,
      transactionFees: totalExpenses * RATE_CONFIG.expensePercentages.transactionFees,
      bankFees: totalExpenses * RATE_CONFIG.expensePercentages.bankFees,
      officeRental: totalExpenses * RATE_CONFIG.expensePercentages.officeRental,
      profit: profit
    };

    const breakdownList = costBreakdownDiv.querySelector('ul');
    breakdownList.innerHTML = `
      <li><b> Business Operation Cost: </b>
        <ul style="padding-left: 1.5rem; list-style-type: disc;">
          <li>Labor and Payrol: $${breakdown.labor.toFixed(2)}</li>
          <li>Travel & Transportation: $${breakdown.travelTransportation.toFixed(2)}</li>
          <li>Insurance: $${breakdown.insurance.toFixed(2)}</li>
          <li>Cleaning Products: $${breakdown.cleaningProducts.toFixed(2)}</li>
          <li>Marketing: $${breakdown.marketing.toFixed(2)}</li>
          <li>Accounting & Legal Fees: $${breakdown.accountingLegal.toFixed(2)}</li>
          <li>Software and Website Subscription: $${breakdown.softwareWebsite.toFixed(2)}</li>
          <li>Equipment Maintenance/Replacement: $${breakdown.equipmentMaintenance.toFixed(2)}</li>
          <li>Transaction Fees (3%): $${breakdown.transactionFees.toFixed(2)}</li>
          <li>Bank Fees (3%): $${breakdown.bankFees.toFixed(2)}</li>
          <li>Office Rental: $${breakdown.officeRental.toFixed(2)}</li>
        </ul>
      </li>
      <li><b>Profit (10% of remaining): $${breakdown.profit.toFixed(2)}</b>
        <ul style="padding-left: 1.5rem; list-style-type: disc;">
          <li>Emergency/Rainy Day Savings (50%): $${profitBreakdown.emergencySavings.toFixed(2)}</li>
          <li>Business Growth Fund (50%): $${profitBreakdown.businessGrowth.toFixed(2)}</li>
        </ul>
      </li>
    `;
  }

  // Handle form submission with Formspree via AJAX
  document.querySelector('.booking-form button').addEventListener('click', function (e) {
    e.preventDefault();

    // Validation
    const bedrooms = parseInt(document.getElementById('bedrooms').value) || 0;
    const bathrooms = parseFloat(document.getElementById('bathrooms').value) || 0;
    const oneTimeChecked = document.getElementById('oneTimeCheckbox').checked;
    const monthlyChecked = document.getElementById('monthlyCheckbox').checked;
    const oneTimeType = oneTimeChecked ? document.querySelector('input[name="oneTimeType"]:checked')?.value : null;
    const email = document.querySelector('input[name="email"]').value.trim();
    const address = document.getElementById('address').value.trim();

    if (bedrooms === 0) {
      alert('Whoops! Please select at least one bedroom.');
      document.getElementById('bedrooms').classList.add('invalid');
      return;
    } else {
      document.getElementById('bedrooms').classList.remove('invalid');
    }
    if (bathrooms === 0) {
      alert('Whoops! Please select at least one bathroom.');
      document.getElementById('bathrooms').classList.add('invalid');
      return;
    } else {
      document.getElementById('bathrooms').classList.remove('invalid');
    }
    if (!oneTimeChecked && !monthlyChecked) {
      alert('Please choose a service frequency (One-time or Monthly) to continue.');
      return;
    }
    if (oneTimeChecked && !oneTimeType) {
      alert('Please select a cleaning type (Light or Deep) for your one-time service.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please provide a valid email address so we can reach you.');
      document.getElementById('email').classList.add('invalid');
      return;
    } else {
      document.getElementById('email').classList.remove('invalid');
    }
    if (!address) {
      alert('Please provide an address for your cleaning service.');
      document.getElementById('address').classList.add('invalid');
      return;
    } else {
      document.getElementById('address').classList.remove('invalid');
    }

    const cleaners = document.getElementById('cleaners').value || '1';
    const kitchen = document.getElementById('kitchen').checked ? 'Yes' : 'No';
    const livingRoom = document.getElementById('livingRoom').checked ? 'Yes' : 'No';
    const pets = document.getElementById('pets').checked ? 'Yes' : 'No';
    const buildingType = document.getElementById('buildingType').value || 'Residential';
    const oneTimeCheckbox = oneTimeChecked ? 'Yes' : 'No';
    const monthlyCheckbox = monthlyChecked ? 'Yes' : 'No';
    const monthlyCount = document.getElementById('monthlyCount').value || '0';
    const extras = [];
    document.querySelectorAll('.section-block:nth-of-type(3) input[type="checkbox"]').forEach(cb => {
      if (cb.checked) extras.push(cb.getAttribute('data-extra'));
    });
    const extrasList = extras.length > 0 ? extras.join(', ') : 'None';
    const discountOption = document.getElementById('discountOption').value || '0';

    document.getElementById('form-bedrooms').value = bedrooms;
    document.getElementById('form-bathrooms').value = bathrooms;
    document.getElementById('form-cleaners').value = cleaners;
    document.getElementById('form-kitchen').value = kitchen;
    document.getElementById('form-living-room').value = livingRoom;
    document.getElementById('form-pets').value = pets;
    document.getElementById('form-building-type').value = buildingType;
    document.getElementById('form-one-time').value = oneTimeCheckbox;
    document.getElementById('form-one-time-type').value = oneTimeType || 'None';
    document.getElementById('form-monthly').value = monthlyCheckbox;
    document.getElementById('form-monthly-count').value = monthlyCount;
    document.getElementById('form-address').value = address;
    document.getElementById('form-extras').value = extrasList;
    document.getElementById('form-discount-option').value = `${discountOption}% (${discountOption === '0' ? 'No discount' : discountOption === '20' ? 'Family & Friend\'s Discount' : 'Promo Discount'})`;

    const form = document.querySelector('.booking-form form');
    form.action = FORMSPREE_URL;
    const formData = new FormData(form);

    fetch(FORMSPREE_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        alert('Awesome! Your quote request has been sent. We’ll get back to you soon!');
        form.reset();
        document.querySelectorAll('.form-section input[type="checkbox"], .form-section input[type="radio"]').forEach(cb => cb.checked = false);
        updateEstimate();
      } else {
        throw new Error('Submission failed');
      }
    })
    .catch(error => {
      alert('Oh no! Something went wrong. Please try again or contact us directly.');
      console.error('Form submission error:', error);
    });
  });

  // Initial estimate
  updateEstimate();
});