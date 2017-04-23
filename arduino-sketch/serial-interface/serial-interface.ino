/*

  Created  2016
  by Ola Adolfsson & Martin Berglund

  PinIDs for analog pins
  A0 = 54
  A15= 69

*/

// ========== Contants ========== //
const int DI_START = 40;
const int DI_END = 53;

const int ADI_START = 60;
const int ADI_END = 67;

const int DO_START = 2;
const int DO_END = 39;

const int AI_START = 54;
const int AI_END = 59;

const int VALVES_RB2_START = 2;
const int VALVES_RB2_END = 9;

const int VALVES_RB3_4_START = 26;
const int VALVES_RB3_4_END = 39;

const int UNDEFINED_VALUE = 10000;

// ========== Setup variables ========== //

typedef struct
{
  int value       = UNDEFINED_VALUE;
  String type     = ""; //DI (Digital IN), ADI (Analog to digital IN), DO (Digital OUT), PWM, AI (Analog IN),
  String function = ""; //close, open, motor, sensor
  int sensorId    = 0;  //id in board struct for sensor in position
}  board_type;

board_type board[69]; //Board setup

long millisWriteTemp    = 0;          //Records last update
long intervalWrite      = 100;        //Interval for write serial

String inputString      = "";         // a string to hold incoming data
String resultString     = "";
boolean stringComplete  = false;      // whether the string is complete

String cmd;
int pin;
int value;

// ========== Setup program ========== //
void setup() {

  // initialize serial
  Serial.begin(115200);

  cmd.reserve(2);

  // Set mode fordigital IN and enable pullup resistor - pins 40 - 53
  for (int pinId = DI_START ; pinId <= DI_END; pinId++) {
    pinMode(pinId, INPUT_PULLUP);
    board[pinId].type = "DI";
  }

  // Set mode for analog (to digital) IN and enable pullup resistor - pins 60 - 67
  for (int pinId = ADI_START ; pinId <= ADI_END; pinId++) {
    pinMode(pinId, INPUT);
    digitalWrite(pinId, HIGH);
    board[pinId].type = "ADI";
  }

  // Set mode for digital OUT pins 2 - 39
  for (int pinId = DO_START ; pinId <= DO_END; pinId++) {
    pinMode(pinId, OUTPUT);
    board[pinId].type = "DO";
  }

  // Set mode PWM
  board[10].type = "PWM";
  board[11].type = "PWM";


  // Set mode for analog IN pins 54 - 59
  for (int pinId = AI_START ; pinId <= AI_END; pinId++) {
    pinMode(pinId, INPUT);
    board[pinId].type = "AI";
  }

  // Setup opened and closed signals for valves
  for (int pinId = VALVES_RB2_START ; pinId <= VALVES_RB2_END; pinId++) {
    board[pinId].sensorId = pinId + 58;
  }

  for (int pinId = VALVES_RB3_4_START ; pinId <= VALVES_RB3_4_END; pinId++) {
    board[pinId].sensorId = pinId + 14;
  }

  // Set function for valves
  board[2].function = "OPEN";
  board[3].function = "CLOSE";
  board[4].function = "OPEN";
  board[5].function = "CLOSE";
  board[6].function = "OPEN";
  board[7].function = "CLOSE";
  board[8].function = "OPEN";
  board[9].function = "CLOSE";

  board[26].function = "OPEN";
  board[27].function = "CLOSE";
  board[28].function = "OPEN";
  board[29].function = "CLOSE";
  board[30].function = "OPEN";
  board[31].function = "CLOSE";
  board[32].function = "OPEN";
  board[33].function = "CLOSE";

  board[34].function = "OPEN";
  board[35].function = "CLOSE";
  board[36].function = "OPEN";
  board[37].function = "CLOSE";
  board[38].function = "OPEN";
  board[39].function = "CLOSE";

}

// ========== Main loop ========== //
void loop() {
  unsigned long currentMillis = millis();

  if (abs(currentMillis - millisWriteTemp) > intervalWrite) {
    millisWriteTemp = currentMillis;
    readPins(); //Write all indata (DI, ADI, AI) to serial port
    checkLimits();  //Check limit switches and shut of if in position - This program is also called when recieving a digital write from serial.
  }

  if (stringComplete) {
    writeToBoard(); //Handle new data on serial port
  }
}

// ========== Program mask out new string from serial and write to board ========== //
void writeToBoard() {
  // cmd: Length 2 char - Not in use
  // pin: Length 3 char
  // value: Length 4 char

  cmd   = inputString.substring(0, 2);
  pin   = inputString.substring(2, 5).toInt();
  value = inputString.substring(5, 9).toInt();

  for (int pinId = 1 ; pinId <= 69; pinId++) {

    if (pin == pinId && board[pinId].type == "DO") {
      //Check if sensor is high (NC) before setting output
      if (digitalRead(board[pin].sensorId) == HIGH)  {
        digitalWrite(pin, value);
      }

      break;

    } 
    else if (pin == pinId && board[pinId].type == "PWM") {
      analogWrite(pin, value);

      break;
    }
  }
  // clear the string:
  inputString = "";
  stringComplete = false;
}

// ========== Program write inputdata to serial ========== //
void readPins() {

  // Read digital pins and print to serial port
  for (int pinId = DI_START ; pinId <= DI_END; pinId++) {
    writeToSerial(pinId, true);
  }

  // Read analog to digital pins and print to serial port
  for (int pinId = ADI_START ; pinId <= ADI_END; pinId++) {
    writeToSerial(pinId, true);
  }

  // Read analog pins and print to serial port
  for (int pinId = AI_START ; pinId <= AI_END; pinId++) {
    writeToSerial(pinId, false);
  }
}

void checkLimits() {
  // Check opened and closed signals for valves and shut valve off if in position
  for (int pinId = VALVES_RB2_START ; pinId <= VALVES_RB2_END; pinId++) {
    if (digitalRead(board[pinId].sensorId) == LOW)  {
      digitalWrite(pinId, LOW);
    }
  }

  for (int pinId = VALVES_RB3_4_START ; pinId <= VALVES_RB3_4_END; pinId++) {
    if (digitalRead(board[pinId].sensorId) == LOW)  {
      digitalWrite(pinId, LOW);
    }
  }
}


// ========== Serial event ========== //
/*
  SerialEvent occurs whenever a new data comes in the
  hardware serial RX.  This routine is run between each
  time loop() runs, so using delay inside loop can delay
  response.  Multiple bytes of data may be available.
*/
void serialEvent() {
  while (Serial.available() && !stringComplete) {
    // get the new byte:
    char inChar = (char)Serial.read();
    // add it to the inputString:
    inputString += inChar;
    // if the incoming character is a newline, set a flag
    // so the main loop can do something about it:
    if (inChar == '\n') {
      stringComplete = true;
    }
  }
}

// ========== Helper functions ========== //

/* WriteToSerial
 * 
 * Reads a pin and writes it to serial if value has changed
 * 
 */
void writeToSerial(int pinId, boolean digital) {
  resultString = pinId;
  resultString += '|';
  int pinValue = 0;
  
  if(digital) {
    pinValue = !digitalRead(pinId);
  } else {
    pinValue = analogRead(pinId);
  }

  // Write to serial of value changed
  if(board[pinId].value != pinValue){
    board[pinId].value = pinValue;

    resultString += pinValue;
    Serial.println(resultString);
  }

}

