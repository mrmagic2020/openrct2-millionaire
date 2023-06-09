/// <reference path="../bin/openrct2.d.ts"> />

// define window classifications for UI usage
const win_class = {
    main: "millionaire",
    debug: "Debug Options"
}
const vault = context.getParkStorage(); // separate storage for each park file

/*---------------Configuration Panel---------------*/
var enabled = vault.get('millionaire.enabled', true); // Main switch [true=on false=off]

var autoCash; // DO NOT EDIT
var replenish = vault.get('millionaire.replenish', false); // Auto cash replenish switch
var notify = vault.get('millionaire.notify', false); // Nofinication switch
var simulate = vault.get('millionaire.simulate', false); // Simulate cash machine switch
var threshold = vault.get('millionaire.threshold', 500); // Cash addition threshold [500=$50]
var addition = vault.get('millionaire.addition', 500); // Amount of cash to be given each time

var defaultCash; // DO NOT EDIT
var changeDefault = vault.get('millionaire.changeDefault', false); // Default wealth switch
var defaultValue = vault.get('millionaire.defaultValue', park.guestInitialCash); // Default guest wealth

if (replenish) enableAutoCashReplenish();
if (changeDefault) enableDefaultCash();

function main() {
    // post plugin setup msg
    park_postMessage("Millionaire has been loaded!", "award");

    // reg UI
    if (typeof ui !== "undefined") {
        ui.registerMenuItem("Millionaire", function () {
            /**@type {WindowDesc} */
            // define main window desc
            const win_desc = {
                "classification": win_class.main,
                "id": 0,
                "title": NAME,
                "width": 240,
                "height": 300,
                "widgets": [
                    // 0 main switch for plugin
                    {
                        "name": "main.switch",
                        "type": "checkbox",
                        "width": 210,
                        "height": 10,
                        "x": 5,
                        "y": 20,
                        "text": "Main Switch",
                        "tooltip": "Unchecking disables all functions!",
                        "isChecked": enabled,
                        "onChange": function (is) {
                            enabled = is;
                            vault.set('millionaire.enabled', enabled);
                            if (is) {
                                park_postMessage("Millionaire enabled!", "money");
                                win.title = NAME + " - Enabled";
                                win.findWidget("replenish.switch").isDisabled = false;
                                win.findWidget("defaultcash.switch").isDisabled = false;
                            } else {
                                park_postMessage("Millionaire disabled", "money");
                                replenish = is;
                                changeDefault = is;
                                vault.set('millionaire.replenish', is);
                                vault.set('millionaire.changeDefault', is);
                                disableAutoCashReplenish();
                                disableDefaultCash();
                                win.title = NAME + " - Disabled";
                                win.findWidget("replenish.switch").isDisabled = true;
                                win.findWidget("defaultcash.switch").isDisabled = true;
                            }
                        }
                    },
                    // 1 Groupbox
                    {
                        "type": "groupbox",
                        "width": 234,
                        "height": 130,
                        "x": 3,
                        "y": 35,
                        "text": "Auto Cash Replenish"
                    },
                    // 2 Replenish Switch
                    {
                        "name": "replenish.switch",
                        "type": "checkbox",
                        "width": 210,
                        "height": 10,
                        "x": 10,
                        "y": 50,
                        "text": "Enable",
                        "tooltip": "Enable/Disable auto cash replenish.",
                        "isChecked": replenish,
                        "isDisabled": !enabled,
                        "onChange": function (is) {
                            replenish = is;
                            vault.set('millionaire.replenish', replenish);
                            if (is) enableAutoCashReplenish();
                            else disableAutoCashReplenish();
                        }
                    },
                    // 3 Notification Switch
                    {
                        "name": "replenish.notification.switch",
                        "type": "checkbox",
                        "width": 210,
                        "height": 10,
                        "x": 10,
                        "y": 65,
                        "text": "Notify when money added",
                        "tooltip": "A message will appear when money is added to guests.",
                        "isChecked": notify,
                        "onChange": function (is) {
                            notify = is;
                            vault.set('millionaire.notify', notify);
                        }
                    },
                    // 4 Label for the next widget
                    {
                        "type": "label",
                        "width": 210,
                        "height": 10,
                        "x": 10,
                        "y": 80,
                        "text": "Cash replenish threshold"
                    },
                    // 5 Add cash threshold
                    {
                        "name": "replenish.threshold.spinner",
                        "type": "spinner",
                        "width": 210,
                        "height": 15,
                        "x": 10,
                        "y": 95,
                        "text": "$" + (threshold/10).toString(),
                        "tooltip": "Guests with cash less than this amount will be given cash.",
                        "isDisabled": simulate,
                        "onDecrement": function () {
                            threshold -= 10;
                            vault.set('millionaire.threshold', threshold);
                            win.findWidget("replenish.threshold.spinner").text = "$" + (threshold/10).toString();
                        },
                        "onIncrement": function () {
                            threshold += 10;
                            vault.set('millionaire.threshold', threshold);
                            win.findWidget("replenish.threshold.spinner").text = "$" + (threshold/10).toString();
                        },
                        "onClick": function () {
                            ui.showTextInput(
                                {
                                    "title": "Set Cash Threshold",
                                    "description": "Guests with cash less than the set amount will be given cash. Please enter an integer.",
                                    "initialValue": (threshold/10).toString(),
                                    "callback": function (value) {
                                        if (value) {
                                            threshold = parseInt(value)*10;
                                            vault.set('millionaire.threshold', threshold);
                                            win.findWidget("replenish.threshold.spinner").text = "$" + (threshold/10).toString();
                                        }
                                    }
                                }
                            );
                        }
                    },
                    // 6 Label for the next widget
                    {
                        "type": "label",
                        "width": 210,
                        "height": 10,
                        "x": 10,
                        "y": 115,
                        "text": "Cash replenish amount"
                    },
                    // 7 Add cash amount
                    {
                        "name": "replenish.amount.spinner",
                        "type": "spinner",
                        "width": 210,
                        "height": 15,
                        "x": 10,
                        "y": 130,
                        "text": "$" + (addition/10).toString(),
                        "tooltip": "The amount of cash given to qualified guests.",
                        "isDisabled": simulate,
                        "onDecrement": function () {
                            addition -= 10;
                            vault.set('millionaire.addition', addition);
                            win.findWidget("replenish.amount.spinner").text = "$" + (addition/10).toString();
                        },
                        "onIncrement": function () {
                            addition += 10;
                            vault.set('millionaire.addition', addition);
                            win.findWidget("replenish.amount.spinner").text = "$" + (addition/10).toString();
                        },
                        "onClick": function () {
                            ui.showTextInput(
                                {
                                    "title": "Set Replenish Amount",
                                    "description": "Set the amount of cash given to qualified guests. Please enter an integer.",
                                    "initialValue": (addition/10).toString(),
                                    "callback": function (value) {
                                        if (value) {
                                            addition = parseInt(value)*10;
                                            vault.set('millionaire.addition', addition);
                                            win.findWidget("replenish.amount.spinner").text = "$" + (addition/10).toString();
                                        }
                                    }
                                }
                            );
                        }
                    },
                    // 8 Simulate ATM Switch
                    {
                        "name": "replenish.simmulate.switch",
                        "type": "checkbox",
                        "width": 210,
                        "height": 10,
                        "x": 10,
                        "y": 150,
                        "text": "Simulate cash machine",
                        "tooltip": "If enabled, guest must has less than $9, happiness more than 105 and energy more than 70 to recieve an additional $50.",
                        "isChecked": simulate,
                        "onChange": function (is) {
                            simulate = is;
                            vault.set('millionaire.simulate', simulate);
                            win.findWidget("replenish.threshold.spinner").isDisabled = is;
                            win.findWidget("replenish.amount.spinner").isDisabled = is;

                            if (is) {
                                threshold = 90;
                                vault.set('millionaire.threshold', threshold);
                                win.findWidget("replenish.threshold.spinner").text = "$9";
    
                                addition = 500;
                                vault.set('millionaire.addition', addition);
                                win.findWidget("replenish.amount.spinner").text = "$50";
                            }
                        }
                    },
                    // 9 Groupbox
                    {
                        "type": "groupbox",
                        "width": 234,
                        "height": 125,
                        "x": 3,
                        "y": 170,
                        "text": "Default Guest Wealth"
                    },
                    // 10 Default cash switch
                    {
                        "name": "defaultcash.switch",
                        "type": "checkbox",
                        "width": 210,
                        "height": 10,
                        "x": 10,
                        "y": 185,
                        "text": "Enable",
                        "tooltip": "Enable/Disable default cash adjustment.",
                        "isChecked": changeDefault,
                        "isDisabled": !enabled,
                        "onChange": function (is) {
                            changeDefault = is;
                            vault.set('millionaire.changeDefault', changeDefault);
                            if (is) {
                                enableDefaultCash();
                                win.findWidget("defaultcash.amount.spinner").isDisabled = false;
                            }
                            else {
                                disableDefaultCash();
                                win.findWidget("defaultcash.amount.spinner").isDisabled = true;
                                win.findWidget("defaultcash.amount.spinner").text = "$" + park.guestInitialCash/10;
                            }
                        }
                    },
                    // 11 Label for the next widget
                    {
                        "type": "label",
                        "width": 210,
                        "height": 10,
                        "x": 10,
                        "y": 200,
                        "text": "Default guest wealth"
                    },
                    // 12 Default cash amount
                    {
                        "name": "defaultcash.amount.spinner",
                        "type": "spinner",
                        "width": 210,
                        "height": 15,
                        "x": 10,
                        "y": 215,
                        "text": "$" + (defaultValue/10).toString(),
                        "tooltip": "Set the amount of cash guests spawn with.",
                        "isDisabled": !changeDefault,
                        "onDecrement": function () {
                            defaultValue -= 10;
                            vault.set('millionaire.defaultValue', defaultValue);
                            win.findWidget("defaultcash.amount.spinner").text = "$" + (defaultValue/10).toString();
                        },
                        "onIncrement": function () {
                            defaultValue += 10;
                            vault.set('millionaire.defaultValue', defaultValue);
                            win.findWidget("defaultcash.amount.spinner").text = "$" + (defaultValue/10).toString();
                        },
                        "onClick": function () {
                            ui.showTextInput(
                                {
                                    "title": "Set Default Guest Wealth",
                                    "description": "Set the amount of cash guests spawn with. Please enter an integer.",
                                    "initialValue": (defaultValue/10).toString(),
                                    "callback": function (value) {
                                        if (value) {
                                            defaultValue = parseInt(value)*10;
                                            vault.set('millionaire.defaultValue', defaultValue);
                                            win.findWidget("defaultcash.amount.spinner").text = "$" + (defaultValue/10).toString();
                                        }
                                    }
                                }
                            );
                        }
                    }
                    // Debug Options Window
                    /*
                    {
                        "type": "button",
                        "width": 210,
                        "height": 15,
                        "x": 10,
                        "y": 170,
                        "text": "Debug Options",
                        "onClick": function () {
                            const win_debug_desc = {
                                "classification": win_class.debug,
                                "title": win_class.debug,
                                "width": 240,
                                "height": 159,
                                "widgets": []
                            };
                            if (!ui.getWindow(win_class.debug)) ui.openWindow(win_debug_desc);
                            else ui.getWindow(win_class.debug).bringToFront();
                        }
                    }*/
                ]
            };
            if (!ui.getWindow(win_class.main)) var win = ui.openWindow(win_desc);
            else ui.getWindow(win_class.main).bringToFront();
        });
    }

    // regAutoCash();
}

/**
 * Alternative function while [issue #20051](https://github.com/OpenRCT2/OpenRCT2/issues/20051) is not solved. 
 * Checks whether the network mode is multi-player or single-player, 
 * so as to avoid calling `park.postMessage` function in servers. 
 * @see https://github.com/OpenRCT2/OpenRCT2/issues/20051
 * @param {string} msg 
 * @param {ParkMessageType} msg_type
 */
function park_postMessage (msg, msg_type) {
  if (network.mode === 'none') {
    if (msg_type) park.postMessage(
      {
        type: msg_type,
        text: msg
      }
    );
    else park.postMessage(msg);
  }
}

function enableAutoCashReplenish () {
    if (!autoCash) autoCash = context.subscribe("interval.day", addCash);
}

function disableAutoCashReplenish() {
    if (autoCash) {
        autoCash.dispose();
        autoCash = undefined;
    }
}

function addCash() {
    const guests = map.getAllEntities("guest");
    guests.forEach(function (guest) {
        if (guest.cash < threshold) {
            if (simulate) {
                if (guest.happiness >= 105 && guest.energy >= 70) {
                    guest.cash += addition;
                }
            } else {
                guest.cash += addition;
            }
        };
    });
    if (notify) {
        park_postMessage("[Millionaire] Money added!", "money");
    }
}

function enableDefaultCash () {
    if (!defaultCash) defaultCash = context.subscribe("guest.generation", function (args) {
        const id = args.id;
        /**@type {Guest} */
        const guest = map.getEntity(id);
        guest.cash = defaultValue;
    });
}

function disableDefaultCash () {
    if (defaultCash) {
        defaultCash.dispose();
        defaultCash = undefined;
    }
}



const NAME = "millionaire";
const VERS = "1.2";
registerPlugin(
    {
        "name": NAME,
        "version": VERS,
        "authors": ["mrmagic"],
        "type": "remote",
        "targetApiVersion": 70,
        "minApiVersion": 34,
        "licence": "MIT",
        "main": main
    }
);