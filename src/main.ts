/* eslint-disable prettier/prettier */
/*
 * Created with @iobroker/create-adapter v1.31.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import { AnelHutCommunication } from "./AnelHutCommunication";
import { HutData } from "./HutData";
import { AnelHut } from "./lib/adapter-config";

// Load your modules here, e.g.:
// import * as fs from "fs";

class Anelhut extends utils.Adapter {
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "anelhut",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	private async UpdateHutData(device: AnelHut, hutData: HutData): Promise<void> {
		// general
		const generalPath = device.DeviceName + "." + "general";
		await this.setObjectNotExistsAsync(generalPath, {
			type: "device",
			common: {
				name: "general",
			},
			native: {},
		});
		await this.setDeviceProperties(generalPath, "DeviceType", "string", hutData.DeviceType);
		await this.setDeviceProperties(generalPath, "DeviceTypeDetail", "string", hutData.Type);
		await this.setDeviceProperties(generalPath, "DeviceName", "string", hutData.DeviceName);
		await this.setDeviceProperties(generalPath, "Blocked", "number", hutData.Blocked);
		await this.setDeviceProperties(generalPath, "Temperature", "number", hutData.Temperature);
		await this.setDeviceProperties(generalPath, "Type", "string", hutData.Type);
		await this.setDeviceProperties(generalPath, "XOR_USER_Password", "boolean", hutData.XOR_USER_Password);
		await this.setDeviceProperties(generalPath, "Firmware", "string", hutData.Firmware);

		//network
		const networkPath = device.DeviceName + "." + "network";
		await this.setObjectNotExistsAsync(networkPath, {
			type: "device",
			common: {
				name: "network",
			},
			native: {},
		});
		await this.setDeviceProperties(networkPath, "DeviceIP", "string", device.DeviceIP);
		await this.setDeviceProperties(networkPath, "MacAdress", "string", hutData.MacAdress);
		await this.setDeviceProperties(networkPath, "UDPSendPort", "string", device.UDPSendPort);
		await this.setDeviceProperties(networkPath, "UDPRecievePort", "string", device.UDPRecievePort);
		await this.setDeviceProperties(networkPath, "HttpPort", "number", hutData.HttpPort);
		await this.setDeviceProperties(networkPath, "Netmask", "string", hutData.Netmask);
		await this.setDeviceProperties(networkPath, "Gateway", "string", hutData.Gateway);

		//power
		const powerPath = device.DeviceName + "." + "power";
		await this.setObjectNotExistsAsync(powerPath, {
			type: "device",
			common: {
				name: "power",
			},
			native: {},
		});
		await this.setDeviceProperties(powerPath, "PowerMeasurement", "boolean", hutData.PowerMeasurement);
		await this.setDeviceProperties(powerPath, "VoltageRMS", "number", hutData.VoltageRMS);
		await this.setDeviceProperties(powerPath, "CurrentRMS", "number", hutData.CurrentRMS);
		await this.setDeviceProperties(powerPath, "LineFrequency", "number", hutData.LineFrequency);
		await this.setDeviceProperties(powerPath, "ActivePower", "number", hutData.ActivePower);
		await this.setDeviceProperties(powerPath, "ApparentPower", "number", hutData.ApparentPower);
		await this.setDeviceProperties(powerPath, "ReactivePower", "number", hutData.ReactivePower);
		await this.setDeviceProperties(powerPath, "PowerFactor", "number", hutData.PowerFactor);

		//sensor
		const sensorPath = device.DeviceName + "." + "sensor";
		await this.setObjectNotExistsAsync(sensorPath, {
			type: "device",
			common: {
				name: "sensor",
			},
			native: {},
		});
		await this.setDeviceProperties(sensorPath, "Sensor_1_Ready", "boolean", hutData.Sensor_1_Ready);
		await this.setDeviceProperties(sensorPath, "Sensor_1_Temperature", "number", hutData.Sensor_1_Temperature);
		await this.setDeviceProperties(sensorPath, "Sensor_1_Humidity", "number", hutData.Sensor_1_Humidity);
		await this.setDeviceProperties(sensorPath, "Sensor_1_Brightness", "number", hutData.Sensor_1_Brightness);

		// relais part:
		if (hutData.Relais != undefined && hutData.Relais.length > 0) {
			await this.setObjectNotExistsAsync(device.DeviceName + "." + "relais", {
				type: "device",
				common: {
					name: "relais",
				},
				native: {},
			});

			hutData.Relais.forEach(async (relais) => {
				const deviceName = device.DeviceName + "." + "relais" + "." + relais.RelaisNumber;
				await this.setObjectNotExistsAsync(deviceName, {
					type: "device",
					common: {
						name: relais.RelaisNumber.toString(),
					},
					native: {},
				});
				await this.setDeviceProperties(deviceName, "Name", "string", relais.Name);
				await this.setDeviceProperties(deviceName, "Status", "boolean", relais.Status, "switch");

				await this.setDeviceProperties(deviceName, "BasePowerWatt", "number", undefined);
				await this.setDeviceProperties(deviceName, "Duration", "number", undefined);
				await this.setDeviceProperties(deviceName, "TotalPowerConsumptionWh", "number", undefined);

				// // only subscribe on the first initialisation
				// if (!device.RelaisChangeSubscription) {
				// 	device.RelaisChangeSubscription = true;
				// 	this.subscribeStates(deviceName + "." + "Status");
				// }

				//the code above is currently not working. Quick fix:
				this.subscribeStates(deviceName + "." + "Status");
			});

			await this.setDeviceProperties(device.DeviceName, "Connected", "boolean", true);
			await this.setDeviceProperties(device.DeviceName, "LastUpdate", "string", hutData.LastUpdate);
		}

		// io part:
		if (hutData.IO != undefined && hutData.IO.length > 0) {
			await this.setObjectNotExistsAsync(device.DeviceName + "." + "io", {
				type: "device",
				common: {
					name: "io",
				},
				native: {},
			});
			hutData.IO.forEach(async (io) => {
				const deviceName = device.DeviceName + "." + "io" + "." + io.IONumber;
				await this.setObjectNotExistsAsync(deviceName, {
					type: "device",
					common: {
						name: io.IONumber.toString(),
					},
					native: {},
				});
				await this.setDeviceProperties(deviceName, "Name", "string", io.IOName);
				await this.setDeviceProperties(deviceName, "Direction", "string", io.IODirection);
				await this.setDeviceProperties(deviceName, "Status", "boolean", io.Status, "switch");

				// only subscribe on the first initialisation
				// if (!device.IoChangeSubscription) {
				// 	device.IoChangeSubscription = true;
				// 	this.subscribeStates(deviceName + "." + "Status");
				// }

				//the code above is currently not working. Quick fix:
				this.subscribeStates(deviceName + "." + "Status");
			});
		}
	}

	private async initializeDevice(device: AnelHut): Promise<void> {
		await this.setObjectNotExistsAsync(device.DeviceName, {
			type: "device",
			common: {
				name: device.DeviceName,
			},
			native: {},
		});

		await this.setDeviceProperties(device.DeviceName, "Connected", "boolean", false);

		// add link to communication
		device.HutCommunication = new AnelHutCommunication(
			device.DeviceIP,
			Number(device.UDPRecievePort),
			Number(device.UDPSendPort),
			device.Username,
			device.Password,
			this.log,
		);

		device.HutCommunication.SubscribeStatusUpdates().subscribe((hutData: HutData) => {
			this.log.info("New hut status update: " + JSON.stringify(hutData));
			device.LastUpdateTimestamp = new Date().toLocaleString();
			this.UpdateHutData(device, hutData);
		});
	}

	/**
	 *
	 * @param parentDeviceName: Name of the parent device
	 * @param variableName: Name of the variable
	 * @param dataType: "boolean, string, number"
	 * @param value: Current Value. If value is undefined it is not written
	 */
	private async setDeviceProperties(
		parentDeviceName: string,
		variableName: string,
		dataType: any,
		value: any,
		role = "indicator",
	): Promise<void> {
		await this.setObjectNotExistsAsync(parentDeviceName + "." + variableName, {
			type: "state",
			common: {
				name: variableName,
				type: dataType,
				role: role,
				read: true,
				write: true,
			},
			native: {},
		});
		if (value != undefined) {
			this.setState(parentDeviceName + "." + variableName, value, true);
		}
	}

	private anelConfigDevices!: Array<AnelHut>;

	private async createInfoObject(): Promise<void> {
		await this.setObjectNotExistsAsync("info", {
			type: "device",
			common: {
				name: "info",
			},
			native: {},
		});
		await this.setDeviceProperties("info", "connection", "boolean", false);
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		// Initialize your adapter here
		this.log.info("Adapter anelhut starting...");
		// this.createInfoObject(); // maybe not necessary

		this.anelConfigDevices = this.config.getAnelDevices;
		if (this.anelConfigDevices == undefined || this.anelConfigDevices.length <= 0) {
			this.log.error("No devices defined. Please edit configuration");
			//update adapter status
			this.setState("info.connection", false, true);
			return;
		}

		this.log.info("Found: " + this.anelConfigDevices.length + " devices in configuration");
		this.anelConfigDevices.forEach(async (d) => {
			this.log.info("Found device in config:  " + d.DeviceName + " | " + d.DeviceIP);
			await this.initializeDevice(d);
		});

		this.log.info("Adapter anelhut initialized");
		//update adapter status
		this.setState("info.connection", true, true);

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw iobroker: " + result);

		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			this.anelConfigDevices.forEach(async (d) => {
				try {
					d.HutCommunication.CloseSocket();
				} catch (e) {}
			});
			this.setState("info.connection", false, true);

			callback();
		} catch (e) {
			callback();
		}
	}

	private SendCommand(id: string, state: number): void {
		// anelhut.0.HUTOG.relais.4.Status
		// anelhut.0.HUTEG.io.1.Status

		const XorEncryptUserPass = false;

		const idParts = id.split(".");
		const hutName = idParts[2];
		const type = idParts[3];
		const slotNumber = Number(idParts[4]);
		const status = idParts[5];

		if (type == "relais" && status == "Status") {
			this.log.info("Relais switch command");
			this.anelConfigDevices.forEach((device) => {
				if (device.DeviceName == hutName) {
					device.HutCommunication.SwitchRelais(slotNumber, state, XorEncryptUserPass);
				}
			});
		}

		if (type == "io" && status == "Status") {
			this.log.info("IO switch command");
			this.anelConfigDevices.forEach((device) => {
				if (device.DeviceName == hutName) {
					device.HutCommunication.SwitchIo(slotNumber, state, XorEncryptUserPass);
				}
			});
		}
	}

	/**
	 * Is called if a subscribed state changes
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		// we have to find the hut device based on the id here!

		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);

			if (!state.ack) {
				// user changed value -> react with action
				this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})` + "-> changed by user");
				this.SendCommand(id, Number(state.val));
			}
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}
}

if (module.parent) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Anelhut(options);
} else {
	// otherwise start the instance directly
	(() => new Anelhut())();
}
