// script.js

// === Rate Configuration ===
const RATE_CONFIG = {
  cleanerRate: 35, // Rate per cleaner per hour (for original pricing)
  commercialRateIncrease: 15,
  timePerBedroom: 0.50,
  timePerBathroom: 0.75,
  timeForKitchen: 0.50,
  timeForLivingRoom: 0.3,
  timeForPets: 0.5,
  serviceTaxRate: 0.03,
  frequencyModifiers: {
    light: 0.5,
    deep: 1.2,
    recurring: 0.5
  },
  extrasMap: {
    'Outside windows': 1.5,
    'Window wells': 1.5,
    'Garage': 1.5,
    'Carpet cleaning': 1.5,
    'Inside oven': 0.5,
    'Baseboard cleaning': 0.01,
    'Laundry': 0.5
  },
  defaultBuildingType: 'Residential',
  recurringDiscounts: {
    1: 0.10,
    2: 0.15,
    3: 0.20,
    4: 0.25
  },
  // Configurable expense percentages (sum to 0.90 or 90% for non-labor expenses)
  expensePercentages: {
    travelTransportation: 0.05, // 5% of 90%
    insurance: 0.10, // 10% of 90%
    cleaningProducts: 0.30, // 30% of 90%
    marketing: 0.10, // 10% of 90%
    accountingLegal: 0.10, // 10% of 90%
    softwareWebsite: 0.05, // 5% of 90%
    equipmentMaintenance: 0.05, // 5% of 90% (corrected typo from 'expansePercentages' to 'expensePercentages')
    transactionFees: 0.03, // 3% of 90%
    bankFees: 0.03, // 3% of 90%
    officeRental: 0.14 // 14% of 90%
  },
  profitMargin: 0.10, // 10% of total estimate
  laborRates: {
    default: 15, // Labor rate for recurring services
    light: 10,  // Labor rate for light cleaning (one-time)
    deep: 20    // Labor rate for deep cleaning (one-time)
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

  if (buildingType === 'Commercial') cleanerRate += RATE_CONFIG.commercialRateIncrease;

  function addItem(hoursCount) {
    const price = hoursCount * cleanerRate * numberOfCleaners;
    const taxedPrice = price * RATE_CONFIG.serviceTaxRate;
    taxTotal += taxedPrice;
    return price + taxedPrice;
  }

  hours += bedrooms * RATE_CONFIG.timePerBedroom;
  hours += bathrooms * RATE_CONFIG.timePerBathroom;
  price = addItem(bedrooms * RATE_CONFIG.timePerBedroom);
  price += addItem(bathrooms * RATE_CONFIG.timePerBathroom);

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

  let modifier = 1;
  if (oneTimeType === 'light') modifier = RATE_CONFIG.frequencyModifiers.light;
  else if (oneTimeType === 'deep') modifier = RATE_CONFIG.frequencyModifiers.deep;
  else if (monthlyCleanings > 0) modifier = RATE_CONFIG.frequencyModifiers.recurring;

  extras.forEach(item => {
    if (RATE_CONFIG.extrasMap.hasOwnProperty(item)) {
      hours += RATE_CONFIG.extrasMap[item];
      price += addItem(RATE_CONFIG.extrasMap[item]);
    }
  });

  if (modifier !== 1) {
    hours *= modifier;
    price *= modifier;
    taxTotal *= modifier;
  }

  price += travelCost;
  taxTotal += travelCost * RATE_CONFIG.serviceTaxRate;
  price += travelCost * RATE_CONFIG.serviceTaxRate;

  // Apply discount for recurring services
  let recurringDiscount = 0;
  if (monthlyCleanings > 0) {
    const discountRate = RATE_CONFIG.recurringDiscounts[monthlyCleanings] || RATE_CONFIG.recurringDiscounts[4];
    recurringDiscount = price * discountRate;
    price -= recurringDiscount;
  }

  // Apply additional discount from dropdown
  const additionalDiscount = price * (discountPercentage / 100);
  price -= additionalDiscount;

  // Adjust hours based on number of cleaners
  const adjustedHours = hours / numberOfCleaners;

  return {
    estimatedHours: Math.round(adjustedHours * 10) / 10,
    estimatedPrice: Math.round(price * 100) / 100,
    subtotal: Math.round((price - taxTotal) * 100) / 100,
    tax: Math.round(taxTotal * 100) / 100,
    recurringDiscount: Math.round(recurringDiscount * 100) / 100,
    additionalDiscount: Math.round(additionalDiscount * 100) / 100
  };
}

// DOM interaction logic
document.addEventListener('DOMContentLoaded', function () {
  const estimateBox = document.querySelector('.estimate-box strong');
  const subtotalLine = document.querySelector('.estimate-box p:nth-child(2)');
  const taxLine = document.querySelector('.estimate-box p:nth-child(3)');
  const estimateTime = document.querySelector('.estimate-box p:nth-child(4)');
  const totalEstimateLine = document.querySelector('.estimate-box p:nth-child(5)');
  const showBreakdownButton = document.getElementById('show-breakdown');
  const costBreakdownDiv = document.getElementById('cost-breakdown');

  const oneTimeCheckbox = document.getElementById('oneTimeCheckbox');
  const oneTimeOptions = document.getElementById('oneTimeOptions');
  const monthlyCheckbox = document.getElementById('monthlyCheckbox');
  const monthlyCount = document.getElementById('monthlyCount');

  // Toggle one-time options visibility
  oneTimeCheckbox.addEventListener('change', function () {
    oneTimeOptions.style.display = this.checked ? 'block' : 'none';
    if (this.checked) {
      monthlyCheckbox.checked = false;
      monthlyCount.disabled = true;
    }
    updateEstimate();
  });

  // Toggle monthly count select
  monthlyCheckbox.addEventListener('change', function () {
    monthlyCount.disabled = !this.checked;
    if (this.checked) {
      oneTimeCheckbox.checked = false;
      oneTimeOptions.style.display = 'none';
    }
    updateEstimate();
  });

  // Toggle cost breakdown visibility
  showBreakdownButton.addEventListener('click', function () {
    costBreakdownDiv.style.display = costBreakdownDiv.style.display === 'none' ? 'block' : 'none';
    showBreakdownButton.textContent = costBreakdownDiv.style.display === 'none' ? 'Show Cost Breakdown' : 'Hide Cost Breakdown';
  });

  // Toggle task list visibility for Light Cleaning
  document.getElementById('show-light-tasks').addEventListener('click', function () {
    const lightTasks = document.getElementById('light-tasks');
    lightTasks.style.display = lightTasks.style.display === 'none' ? 'block' : 'none';
    this.textContent = lightTasks.style.display === 'none' ? 'Show Tasks' : 'Hide Tasks';
  });

  // Toggle task list visibility for Deep Cleaning
  document.getElementById('show-deep-tasks').addEventListener('click', function () {
    const deepTasks = document.getElementById('deep-tasks');
    deepTasks.style.display = deepTasks.style.display === 'none' ? 'block' : 'none';
    this.textContent = deepTasks.style.display === 'none' ? 'Show Tasks' : 'Hide Tasks';
  });

  // Update estimate on input change
  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', updateEstimate);
  });

  function updateEstimate() {
    const bedrooms = parseInt(document.getElementById('bedrooms').value) || 0;
    const bathrooms = parseInt(document.getElementById('bathrooms').value) || 0;
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

    // Update all estimate values
    estimateBox.textContent = `$${result.estimatedPrice.toFixed(2)}`;
    subtotalLine.textContent = `Subtotal: $${result.subtotal.toFixed(2)}`;
    taxLine.textContent = `Service Tax (3%): $${result.tax.toFixed(2)}`;
    // Format estimated time to hours and minutes
    const totalMinutes = Math.round(result.estimatedHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    estimateTime.textContent = `Estimated Time: ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const totalEstimate = result.subtotal + result.tax;

    // Display the discount above the total estimate
    if (result.recurringDiscount > 0 || result.additionalDiscount > 0) {
      const discountLine = document.createElement('p');
      discountLine.textContent = `Discount: -$${Math.round((result.recurringDiscount + result.additionalDiscount) * 100) / 100}.00`;
      if (!document.querySelector('.estimate-box p.discount-line')) {
        totalEstimateLine.parentElement.insertBefore(discountLine, totalEstimateLine);
        discountLine.className = 'discount-line';
      } else {
        document.querySelector('.estimate-box p.discount-line').textContent = `Discount: -$${Math.round((result.recurringDiscount + result.additionalDiscount) * 100) / 100}.00`;
      }
    } else if (document.querySelector('.estimate-box p.discount-line')) {
      document.querySelector('.estimate-box p.discount-line').remove();
    }

    // Update the final total estimate
    totalEstimateLine.textContent = `Total Estimate Per Cleaning: $${Math.round(totalEstimate * 100) / 100}.00`;

    // Calculate and update cost breakdown
    const laborRate = monthlyCleanings > 0 ? RATE_CONFIG.laborRates.default : // Use default for recurring
                     oneTimeType === 'light' ? RATE_CONFIG.laborRates.light :
                     oneTimeType === 'deep' ? RATE_CONFIG.laborRates.deep :
                     RATE_CONFIG.laborRates.default; // Fallback to default if no selection
    const laborCost = laborRate * result.estimatedHours * numberOfCleaners; // Static labor cost
    const remainingAmount = totalEstimate - laborCost; // Remaining amount after labor
    const totalExpenses = remainingAmount * 0.90; // 90% of remaining amount
    const profit = remainingAmount * 0.10; // 10% of remaining amount
    const profitBreakdown = {
      emergencySavings: profit * 0.5, // 50% of profit
      businessGrowth: profit * 0.5 // 50% of profit
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

    // Update cost breakdown display with profit sub-breakdown
    const breakdownList = costBreakdownDiv.querySelector('ul');
    breakdownList.innerHTML = `
    <li><b>Business Operation Cost</b></li>
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
      <li><b>Business Growth - Profit (10% of remaining):</b> $${breakdown.profit.toFixed(2)}
        <ul style="padding-left: 1.5rem; list-style-type: disc;">
          <li>Emergency/Rainy Day Savings (50%): $${profitBreakdown.emergencySavings.toFixed(2)}</li>
          <li>Business Growth Fund (50%): $${profitBreakdown.businessGrowth.toFixed(2)}</li>
        </ul>
      </li>
    `;
  }

  // Handle submit request
  document.querySelector('.booking-form button').addEventListener('click', function (e) {
    e.preventDefault(); // Prevent default button behavior

    // Collect form data
    const name = document.querySelector('.booking-form input[type="text"]:nth-child(2)').value || 'Not provided';
    const phone = document.querySelector('.booking-form input[type="text"]:nth-child(4)').value || 'Not provided';
    const email = document.querySelector('.booking-form input[type="email"]').value || 'Not provided';
    const preferredTime = document.querySelector('.booking-form input[type="datetime-local"]').value || 'Not provided';
    const notes = document.querySelector('.booking-form textarea').value || 'No notes';

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

    // Format the email body
    const subject = 'New Cleaning Request from Website';
    const body = `
      New Cleaning Request Submitted on ${new Date().toLocaleString()}

      **Booking Details:**
      Name: ${name}
      Phone: ${phone}
      Email: ${email}
      Preferred Time: ${preferredTime}
      Notes: ${notes}

      **Property Info:**
      Bedrooms: ${bedrooms}
      Bathrooms: ${bathrooms}
      Number of Cleaners: ${cleaners}
      Kitchen: ${kitchen}
      Living Room: ${livingRoom}
      Pets: ${pets}
      Building Type: ${buildingType}
      Address: ${address}
      Discount Option: ${discountOption}% (${discountOption === '0' ? 'No discount' : discountOption === '20' ? 'Family & Friend\'s Discount' : 'Promo Discount'})

      **Service Frequency:**
      One-time: ${oneTimeCheckbox}
      One-time Type: ${oneTimeType}
      Monthly: ${monthlyCheckbox}
      Monthly Cleanings: ${monthlyCount}

      **Extras:**
      ${extrasList}
    `.trim().replace(/\n/g, '%0D%0A'); // Convert newlines to URL-encoded format for mailto

    // Open email client with pre-filled data
    window.location.href = `mailto:ikatutu.mcs@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;

    // Notify user
    alert('Your request has been submitted! Please check your email client to send the request.');

    // Optional: Clear the form (uncomment if desired)
    // document.querySelectorAll('.booking-form input, .booking-form textarea').forEach(input => input.value = '');
    // document.querySelectorAll('.form-section input[type="checkbox"], .form-section input[type="radio"]').forEach(cb => cb.checked = false);
  });

  // Initial estimate
  updateEstimate();
});