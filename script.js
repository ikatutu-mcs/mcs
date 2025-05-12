// script.js

// === Rate Configuration ===
const RATE_CONFIG = {
  cleanerRate: 35,
  commercialRateIncrease: 15,
  timePerBedroom: 0.55,
  timePerBathroom: 0.75,
  timeForKitchen: 0.55,
  timeForLivingRoom: 0.5,
  timeForPets: 0.5,
  serviceTaxRate: 0.00,
  frequencyModifiers: {
    light: 1.00,
    deep: 1.2,
    recurring: 0.5
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
    2: 0.15,
    3: 0.20,
    4: 0.25
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

function calculateEstimate({
  bedrooms = 0,
  bathrooms = 0,
  hasKitchen = false,
  hasLivingRoom = false,
  hasPets = false,
  buildingType = RATE_CONFIG.defaultBuildingType,
  oneTimeType = null,
  monthlyCleanings = 0,
  extras = [],
  travelCost = 0,
  numberOfCleaners = 1,
  discountPercentage = 0
}) {
  let cleanerRate = RATE_CONFIG.cleanerRate;
  let hours = 0;
  let taxTotal = 0;
  let price = 0;
  let baseSubtotal = 0; // Track the true pre-discount subtotal

  if (buildingType === 'Commercial') cleanerRate += RATE_CONFIG.commercialRateIncrease;

  function addItem(hoursCount) {
    const price = hoursCount * cleanerRate * numberOfCleaners;
    const taxedPrice = price * RATE_CONFIG.serviceTaxRate;
    taxTotal += taxedPrice;
    baseSubtotal += price; // Add to base subtotal before tax
    return price + taxedPrice;
  }

  hours += bedrooms * RATE_CONFIG.timePerBedroom;
  const wholeBathrooms = Math.floor(bathrooms);
  const hasHalfBathroom = bathrooms - wholeBathrooms >= 0.5;
  hours += wholeBathrooms * RATE_CONFIG.timePerBathroom;
  if (hasHalfBathroom) {
    hours += (RATE_CONFIG.timePerBathroom * 0.5);
  }
  price += addItem(wholeBathrooms * RATE_CONFIG.timePerBathroom);
  if (hasHalfBathroom) {
    price += addItem(RATE_CONFIG.timePerBathroom * 0.5);
  }

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
  baseSubtotal += travelCost; // Include travel in base subtotal

  let recurringDiscount = 0;
  if (monthlyCleanings > 0) {
    const discountRate = RATE_CONFIG.recurringDiscounts[monthlyCleanings] || RATE_CONFIG.recurringDiscounts[4];
    recurringDiscount = baseSubtotal * discountRate; // Apply to baseSubtotal
  }

  const additionalDiscount = baseSubtotal * (discountPercentage / 100); // Apply to baseSubtotal
  const totalDiscount = recurringDiscount + additionalDiscount;
  price -= totalDiscount;

  const adjustedHours = hours / numberOfCleaners;

  return {
    estimatedHours: Math.round(adjustedHours * 10) / 10,
    estimatedPrice: Math.round(price * 100) / 100,
    subtotal: Math.round(baseSubtotal * 100) / 100, // Use true pre-discount subtotal
    tax: Math.round(taxTotal * 100) / 100,
    recurringDiscount: Math.round(recurringDiscount * 100) / 100,
    additionalDiscount: Math.round(additionalDiscount * 100) / 100
  };
}

// DOM interaction logic
document.addEventListener('DOMContentLoaded', function () {
  const estimateBox = document.querySelector('.estimate-box strong');
  const subtotalLine = document.querySelector('.estimate-box p:nth-child(2)');
  const estimateTime = document.querySelector('.estimate-box p:nth-child(3)');
  // Use a more specific selector for totalEstimateLine
  const totalEstimateLine = document.querySelector('.estimate-box p:nth-child(4)');
  const showBreakdownButton = document.getElementById('show-breakdown');
  const costBreakdownDiv = document.getElementById('cost-breakdown');

  const oneTimeCheckbox = document.getElementById('oneTimeCheckbox');
  const oneTimeOptions = document.getElementById('oneTimeOptions');
  const monthlyCheckbox = document.getElementById('monthlyCheckbox');
  const monthlyCount = document.getElementById('monthlyCount');

  oneTimeCheckbox.addEventListener('change', function () {
    oneTimeOptions.style.display = this.checked ? 'block' : 'none';
    if (this.checked) {
      monthlyCheckbox.checked = false;
      monthlyCount.disabled = true;
      monthlyCount.value = '0'; // Reset monthly cleanings
    }
    updateEstimate();
  });

  monthlyCheckbox.addEventListener('change', function () {
    monthlyCount.disabled = !this.checked;
    if (this.checked) {
      oneTimeCheckbox.checked = false;
      oneTimeOptions.style.display = 'none';
      document.querySelectorAll('input[name="oneTimeType"]').forEach(radio => radio.checked = false); // Reset one-time type
    }
    updateEstimate();
  });

  showBreakdownButton.addEventListener('click', function () {
    costBreakdownDiv.style.display = costBreakdownDiv.style.display === 'none' ? 'block' : 'none';
    showBreakdownButton.textContent = costBreakdownDiv.style.display === 'none' ? 'Show Cost Breakdown' : 'Hide Cost Breakdown';
  });

  document.getElementById('show-light-tasks').addEventListener('click', function () {
    const lightTasks = document.getElementById('light-tasks');
    lightTasks.style.display = lightTasks.style.display === 'none' ? 'block' : 'none';
    this.textContent = lightTasks.style.display === 'none' ? 'Show Tasks' : 'Hide Tasks';
  });

  document.getElementById('show-deep-tasks').addEventListener('click', function () {
    const deepTasks = document.getElementById('deep-tasks');
    deepTasks.style.display = deepTasks.style.display === 'none' ? 'block' : 'none';
    this.textContent = deepTasks.style.display === 'none' ? 'Show Tasks' : 'Hide Tasks';
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

    // Calculate pre-discount subtotal (sum of services before discounts, excluding tax)
    let preDiscountPrice = 0;
    function addPreDiscountItem(hoursCount) {
      let cleanerRate = RATE_CONFIG.cleanerRate;
      if (buildingType === 'Commercial') cleanerRate += RATE_CONFIG.commercialRateIncrease;
      return hoursCount * cleanerRate * numberOfCleaners;
    }
    preDiscountPrice += addPreDiscountItem(bedrooms * RATE_CONFIG.timePerBedroom);
    const wholeBathrooms = Math.floor(bathrooms);
    const hasHalfBathroom = bathrooms - wholeBathrooms >= 0.5;
    preDiscountPrice += addPreDiscountItem(wholeBathrooms * RATE_CONFIG.timePerBathroom);
    if (hasHalfBathroom) {
      preDiscountPrice += addPreDiscountItem(RATE_CONFIG.timePerBathroom * 0.5);
    }
    if (hasKitchen) preDiscountPrice += addPreDiscountItem(RATE_CONFIG.timeForKitchen);
    if (hasLivingRoom) preDiscountPrice += addPreDiscountItem(RATE_CONFIG.timeForLivingRoom);
    if (hasPets) preDiscountPrice += addPreDiscountItem(RATE_CONFIG.timeForPets);
    extras.forEach(item => {
      if (RATE_CONFIG.extrasMap.hasOwnProperty(item)) {
        preDiscountPrice += addPreDiscountItem(RATE_CONFIG.extrasMap[item]);
      }
    });
    const preDiscountSubtotal = Math.round(preDiscountPrice * 100) / 100;

    estimateBox.textContent = `$${result.estimatedPrice.toFixed(2)}`;
    subtotalLine.textContent = `Subtotal: $${preDiscountSubtotal.toFixed(2)}`;
    const totalMinutes = Math.round(result.estimatedHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    estimateTime.textContent = `Estimated Time: ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const totalEstimate = preDiscountSubtotal > 0 ? preDiscountSubtotal - result.recurringDiscount - result.additionalDiscount - result.tax : 0;

    // Display discount line if either discount is greater than 0 and subtotal is valid
    if ((result.recurringDiscount > 0 || result.additionalDiscount > 0) && preDiscountSubtotal > 0) {
      let discountLine = document.querySelector('.estimate-box p.discount-line');
      if (!discountLine) {
        discountLine = document.createElement('p');
        discountLine.className = 'discount-line';
        totalEstimateLine.parentElement.insertBefore(discountLine, totalEstimateLine);
      }
      discountLine.textContent = `Discount: -$${Math.round((result.recurringDiscount + result.additionalDiscount) * 100) / 100}.00`;
    } else if (document.querySelector('.estimate-box p.discount-line')) {
      document.querySelector('.estimate-box p.discount-line').remove();
    }

    totalEstimateLine.textContent = `Total Estimate Per Cleaning: $${Math.round(totalEstimate * 100) / 100}.00`;

    const laborRate = monthlyCleanings > 0 ? RATE_CONFIG.laborRates.default :
                     oneTimeType === 'light' ? RATE_CONFIG.laborRates.light :
                     oneTimeType === 'deep' ? RATE_CONFIG.laborRates.deep :
                     RATE_CONFIG.laborRates.default;
    const laborCost = laborRate * result.estimatedHours * numberOfCleaners;
    const remainingAmount = totalEstimate - laborCost;
    const totalExpenses = remainingAmount * 0.90;
    const profit = remainingAmount * 0.10;
    const profitBreakdown = {
      emergencySavings: profit * 0.5,
      businessGrowth: profit * 0.5
    };
    const breakdown = {
      labor: laborCost,
      travelTransportation: totalExpenses * RATE_CONFIG.expensePercentages.travelTransportation,
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
        <li>Labor: $${breakdown.labor.toFixed(2)}</li>
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

    const bedrooms = document.getElementById('bedrooms').value || '0';
    const bathrooms = document.getElementById('bathrooms').value || '0';
    const cleaners = document.getElementById('cleaners').value || '1';
    const kitchen = document.getElementById('kitchen').checked ? 'Yes' : 'No';
    const livingRoom = document.getElementById('livingRoom').checked ? 'Yes' : 'No';
    const pets = document.getElementById('pets').checked ? 'Yes' : 'No';
    const buildingType = document.getElementById('buildingType').value || 'Residential';
    const oneTimeCheckbox = document.getElementById('oneTimeCheckbox').checked ? 'Yes' : 'No';
    const oneTimeType = document.querySelector('input[name="oneTimeType"]:checked')?.value || 'None';
    const monthlyCheckbox = document.getElementById('monthlyCheckbox').checked ? 'Yes' : 'No';
    const monthlyCount = document.getElementById('monthlyCount').value || '0';
    const address = document.getElementById('address').value || 'Not provided';
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
    document.getElementById('form-one-time-type').value = oneTimeType;
    document.getElementById('form-monthly').value = monthlyCheckbox;
    document.getElementById('form-monthly-count').value = monthlyCount;
    document.getElementById('form-address').value = address;
    document.getElementById('form-extras').value = extrasList;
    document.getElementById('form-discount-option').value = `${discountOption}% (${discountOption === '0' ? 'No discount' : discountOption === '20' ? 'Family & Friend\'s Discount' : 'Promo Discount'})`;

    const form = document.querySelector('.booking-form form');
    const formData = new FormData(form);

    fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        alert('Your request has been submitted successfully!');
        form.reset();
        document.querySelectorAll('.form-section input[type="checkbox"], .form-section input[type="radio"]').forEach(cb => cb.checked = false);
        updateEstimate();
      } else {
        throw new Error('Submission failed');
      }
    })
    .catch(error => {
      alert('There was an error submitting your request. Please try again later.');
      console.error('Form submission error:', error);
    });
  });

  // Initial estimate
  updateEstimate();
});