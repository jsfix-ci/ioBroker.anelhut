export class HutData {
	DeviceType!: string;
	DeviceName!: string;
	IP!: string;
	Netmask!: string;
	Gateway!: string;
	MacAdress!: string;
	Blocked!: number;
	HttpPort!: number;
	Temperature!: number;
	Type!: string;
	XOR_USER_Password!: boolean;
	Firmware!: string;

	PowerMeasurement!: boolean;
	VoltageRMS!: number;
	CurrentRMS!: number;
	LineFrequency!: number;
	ActivePower!: number;
	ApparentPower!: number;
	ReactivePower!: number;
	PowerFactor!: number;

	Sensor_1_Ready!: boolean;
	Sensor_1_Temperature!: number;
	Sensor_1_Humidity!: number;
	Sensor_1_Brightness!: number;

	Relais!: Array<Relais>;
	IO!: Array<IOState>;
	LastUpdate!: string;
}

export class Relais {
	public RelaisNumber: number;
	public Name: string;
	public Status: number;
	public BasePowerWatt: number = 0;
	public TotalOnDurationSec: number = 0;
	constructor(RelaisNumber: number, Name: string, Status: number) {
		this.RelaisNumber = RelaisNumber;
		this.Name = Name;
		this.Status = Status;
	}

	public getTotalPowerConsumptionWh(): number {
		return (this.BasePowerWatt * this.TotalOnDurationSec) / (60 * 60);
	}
}

export class IOState {
	public IONumber: number;
	public IOName: string;
	public IODirection: number;
	public Status: number;
	constructor(IONumber: number, IOName: string, IODirection: number, Status: number) {
		this.IONumber = IONumber;
		this.IOName = IOName;
		this.IODirection = IODirection;
		this.Status = Status;
	}
}
