/////////////////////////////////////////////////////////////////////////////
// BUDGET CONTROLLER


let budgetController = (() => {

    class Expense {
        constructor(id, description, value) {
            this.id = id;
            this.description = description;
            this.value = value;
            this.percentage = -1;
        }
        calcPercentage(totalIncome) {
            if (totalIncome > 0) {
                this.percentage = Math.round((this.value / totalIncome) * 100);
            } else {
                this.percentage = -1;
            }
        }
        getPercentage() {
            return this.percentage;
        }
    }




    class Income {
        constructor(id, description, value) {
            this.id = id;
            this.description = description;
            this.value = value;
        }
    }

    const calculateTotal = (type) => {
        let sum = 0;
        data.allItems[type].forEach( (e) => sum += e.value);

        // we could return the sum, but even better to store it in global data object
        data.totals[type] = sum;
    }

    const data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1,
    };

    return {
        addItem: function (type, des, val) {
            let newItem, ID;

            //[1,2,3,4,5] next id = 6;
            //[1,3,5, 8] next it = 6 
            //ID = last ID + 1;

            // create new ID
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
                //data.allItems.inc[3].id + 1;  
            } else {
                ID = 0;
            }

            // Create new item base on 'inc' or 'exp' 
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }

            // Push item into data
            data.allItems[type].push(newItem);
            //return new item so other modules can use it!
            return newItem;
        },

        deleteItem: function(type, id) {
            let ids, index; 
            // ids = [1, 2, 4, 6, 8]
            // if we need id of 6 index is actually 3

            ids = data.allItems[type].map((e) => e.id);
            index = ids.indexOf(id);

            if(index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },

        calculateBudget: function() {
            
            //calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');

            // calculate the budget - income - expense
            data.budget = data.totals.inc - data.totals.exp;
            //calculate the percentage of income spent
            if(data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function() {

            data.allItems.exp.forEach((e) => e.calcPercentage(data.totals.inc));
        },

        getPercentages: function() {
            let allPercentages = data.allItems.exp.map((e) => e.getPercentage());
            return allPercentages;
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },

        //delete this later
        testing: () => data,
    };

})();





////////////////////////////////////////////////////////////////////
// UI CONTROLLER

let UIController = (() => {

    const DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercentageLabel: '.item__percentage',
        dateLabel: '.budget__title--month',
    };

    const formatNumber = (num, type) => {
        let numSplit, int, dec;
        // 1. + or - before number
        // 2. two decimal points
        // 3.  comma separating thousends
        //if 2350.45667 ----> + 2,350.45
        //if 1000 ---> + 1,000.00
        num = Math.abs(num);
        num = num.toFixed(2);
        numSplit = num.split('.');

        int = numSplit[0];

        if (int.length > 3) {
            int = `${int.substr(0, int.length - 3)},${int.substr(int.length - 3, int.length)}`;
        };

        dec = numSplit[1];

        return `${(type === 'exp' ? '-' : '+')} ${int}.${dec}`;

    };

    return {
        getInput: function () {
            return ({
                type: document.querySelector(DOMstrings.inputType).value,
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value),
            });
        },

        addListItem: function (obj, type) {
            let html, newHtml, element;
            // Create placeholder text
            if (type === 'inc') {

                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';

            } else if (type === 'exp') {

                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            //Replace placeholder with real data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            //Insert HTML into the DOM
            document.querySelector(element).insertAdjacentHTML("beforeend", newHtml);

        },

        deleteListItem: function(selectorID) {
            let el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
            
        },

        clearFields: function () {
            const fields = document.querySelectorAll(`${DOMstrings.inputDescription}, ${DOMstrings.inputValue}`);
            [...fields].forEach((e) => {
                e.value = '';
            });
            fields[0].focus();
        },

        displayBudget: (obj) => {
            let type;

            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

            if(obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = `${obj.percentage}%`;
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '--';
            }
            // getBudget: function() {
            // return 
            //     budget: data.budget,
            //     totalInc: data.totals.inc,
            //     totalExp: data.totals.exp,
            //     percentage: data.percentage
        },

        displayPercentages: function(percentages) {

            let fields = document.querySelectorAll(DOMstrings.expensesPercentageLabel);
            fields.forEach((e, index) => {
                    return e.textContent = `${percentages[index]}%`;
            });

        },

        displayMonth: function() {
            let now, monthNames, month, year;

            now = new Date();

            monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            month = now.getMonth();
            year = now.getFullYear();

            document.querySelector(DOMstrings.dateLabel).textContent = `${monthNames[month]} ${year}`;
        },

        changedType: function() {

            let fields = document.querySelectorAll(`${DOMstrings.inputType},${DOMstrings.inputDescription},${DOMstrings.inputValue}`);
            fields.forEach((e) => e.classList.toggle('red-focus'));

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },

        getDOMstrings: () =>  DOMstrings,
    };

})();


////////////////////////////////////////////////////////////////////////
// APP CONTROLLER

let controller = ((budgetCtrl, UICtrl) => {

    const setupEventListeners = () => {

        const DOM = UICtrl.getDOMstrings();

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);

    };

    const updateBudget = () => {

        //1. Calculate the budget 
        budgetCtrl.calculateBudget();
        //2. Return the budget
        let budget = budgetCtrl.getBudget();
        //3. Display the budget on the UI
        UICtrl.displayBudget(budget);
        };

    const updatePercentages = () => {

        // 1. Calculate percentages
        budgetCtrl.calculatePercentages();
        // 2. Read percentages from the budget controller
        let percentages = budgetCtrl.getPercentages();
        // 3. Update the UI with the new percentages
        UICtrl.displayPercentages(percentages);
    };       


    const ctrlAddItem = () => {
        // 1. Get the field input data
        let input, newItem;
        input = UICtrl.getInput();


        if(input.description !== '' && !isNaN(input.value) && input.value > 0) {

             // 2. Add item to the budget controller
        newItem = budgetCtrl.addItem(input.type, input.description, input.value);
        // 3. Add the new item to the UI
        UICtrl.addListItem(newItem, input.type);

        // 4. Clear the fields
        UICtrl.clearFields();

        // 5. Calc and upadate budget
        updateBudget();

        //6. calc and update percentages
        updatePercentages();
        }
       

    };

    const ctrlDeleteItem = (e) => {
        let itemID, splitID, type, ID;

        itemID = e.target.closest('.item').id;

        if(itemID) {
            //inc-1
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);

            // 1. delete the item from data structure
            budgetCtrl.deleteItem(type, ID);
            // 2. delete the item from UI
            UICtrl.deleteListItem(itemID);
            // 3. update and show the new budget
            updateBudget();
            //4. calc and update percentages
            updatePercentages();
        }

    };

    return {
        init: () => {
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    };

})(budgetController, UIController);

controller.init();
