/// <reference path="/Users/arnold.zhou/Documents/VSC/Javascript/OpecRCT/openrct2.d.ts"> />

// define window classifications for UI usage
const win_class = {
    main: "millionaire",
    debug: "Debug Options"
}

// Configuration
var enabled = true;

var autoCash;
var replenish = true;
var notify = false;
var simulate = false;
var threshold = 500;
var addition = 500;

var defaultCash;
var changeDefault = false;
var defaultValue = 1000;


if (replenish) enableAutoCashReplenish();

function main() {
    // post plugin setup msg
    park.postMessage(
        {
            "type": "award",
            "text": "Millionaire has been loaded!"
        }
    );

    // reg UI
    if (typeof ui !== "undefined") {
        ui.registerMenuItem("Millionaire", function () {
            /**@type {WindowDesc} */
            // define main window desc
            const win_desc = {
                "classification": win_class.main,
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
                            replenish = is;
                            if (is) {
                                park.postMessage(
                                    {
                                        type: "money",
                                        text: "Millionaire enabled!"
                                    }
                                );
                                win.title = NAME + " - Enabled";
                                win.findWidget("replenish.switch").isDisabled = false;
                            } else {
                                park.postMessage(
                                    {
                                        type: "money",
                                        text: "Millionaire disabled!"
                                    }
                                );
                                disableAutoCashReplenish();
                                win.title = NAME + " - Disabled";
                                win.findWidget("replenish.switch").isDisabled = true;
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
                            if (enabled) {
                                replenish = is;
                                if (is) enableAutoCashReplenish();
                                else disableAutoCashReplenish();
                            } else {
                                ui.showError("Error", "Main switch is off!");
                            }
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
                            win.findWidget("replenish.threshold.spinner").text = "$" + (threshold/10).toString();
                        },
                        "onIncrement": function () {
                            threshold += 10;
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
                            win.findWidget("replenish.amount.spinner").text = "$" + (addition/10).toString();
                        },
                        "onIncrement": function () {
                            addition += 10;
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
                        "onChange": function (is) {
                            simulate = is;
                            win.findWidget("replenish.threshold.spinner").isDisabled = is;
                            win.findWidget("replenish.amount.spinner").isDisabled = is;

                            if (is) {
                                threshold = 90;
                                win.findWidget("replenish.threshold.spinner").text = "$9";
    
                                addition = 500;
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
        park.postMessage(
            {
                type: "money",
                text: "[Millionaire] Money added!"
            }
        );
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



const NAME = "Millionaire";
const VERS = "1.0";
registerPlugin(
    {
        "name": NAME,
        "version": VERS,
        "authors": "mrmagic",
        "type": "remote",
        "licence": "MIT",
        "main": main
    }
);