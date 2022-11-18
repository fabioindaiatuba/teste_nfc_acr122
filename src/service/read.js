var pcscLib = require("pcsclite");
const myEmitter = require("../service/EventEmitter");
const globalEmitter = myEmitter.emitter;

var pcsc = pcscLib();

const VALID_URL = "tag.cclid.com".toLowerCase();

const dataValue = {
  readyName: "",
  readyStatus: "",
  tagId: "",
  tagOnReader: false,
  dataTag: "",
  urlCompare: "",
  urlValid: false,
  error: "",
};

pcsc.on("reader", function (reader) {
  dataValue.readyName = reader.name;
  dataValue.readyStatus = "Conectado";

  reader.autoProcessing = false;

  reader.on("error", function (err) {
    console.warn("Error :", err.message);
    dataValue.error = err.message;
  });

  dataValue.error = "";

  reader.on("status", function (status) {
    var changes = this.state ^ status.state;
    if (changes) {
      globalEmitter.emit("dataSend", dataValue);
      if (
        changes & this.SCARD_STATE_EMPTY &&
        status.state & this.SCARD_STATE_EMPTY
      ) {
        console.log("card removed"); /* card removed */
        dataValue.tagOnReader = false;
        globalEmitter.emit("dataSend", dataValue);
      } else if (
        changes & this.SCARD_STATE_PRESENT &&
        status.state & this.SCARD_STATE_PRESENT
      ) {
        reader.connect(null, async function (err, protocol) {
          console.log("card insert");
          dataValue.tagOnReader = true;

          if (err) {
            console.warn(err);
            error = err.message;
            globalEmitter.emit("globalEmitter", dataValue);
          } else {
            // READ TAG ID COM LENGTH 8
            const dataTag = await sendCommand(
              new Buffer.from([0xff, 0xca, 0x00, 0x00, 0x04]),
              10,
              protocol
            );
            if (dataTag && dataTag.hasError) {
              error = dataTag.data;
              globalEmitter.emit("dataSend", dataValue);
            }

            const dataBlock1 = await sendCommand(
              new Buffer.from([0xff, 0xb0, 0x00, 0x04, 0x10]),
              20,
              protocol
            );
            if (dataBlock1 && dataBlock1.hasError) {
              error = dataBlock1.data;
              globalEmitter.emit("dataSend", dataValue);
            }

            const dataBlock2 = await sendCommand(
              new Buffer.from([0xff, 0xb0, 0x00, 0x08, 0x10]),
              20,
              protocol,
              true
            );
            if (dataBlock2 && dataBlock2.hasError) {
              error = dataBlock2.data;
              globalEmitter.emit("dataSend", dataValue);
            }

            if (dataTag && dataTag.data) {
              dataValue.tagId = dataTag.data
                .toString("hex")
                .toUpperCase()
                .substring(0, 12);
            }

            if (
              dataBlock1 &&
              dataBlock2 &&
              dataBlock1.data &&
              dataBlock2.data
            ) {
              const blocks = (
                dataBlock1.data.toString() + dataBlock2.data.toString()
              )
                .toLowerCase()
                .trim();

              const blocksString = blocks
                .replaceAll("\u0000", "")
                .replaceAll("\u0001", "")
                .replaceAll("\u0002", "")
                .replaceAll("\u0003", "")
                .replaceAll("\u0004", "")
                .replaceAll("\u0005", "")
                .replaceAll("\u0006", "")
                .replaceAll("\u0007", "")
                .replaceAll("\u0012", "")
                .replaceAll("\u000e", "")
                .replaceAll("�", "");

              const urlCompare = "u" + VALID_URL.trim();

              console.log("TAG:", blocksString.replaceAll("�", ""));
              console.log("COMPARE:", urlCompare);
              blocksString.indexOf(urlCompare) >= 0
                ? (dataValue.urlValid = true)
                : (dataValue.urlValid = false);

              dataValue.urlCompare = urlCompare;
              dataValue.dataTag = blocksString;
            }

            globalEmitter.emit("dataSend", dataValue);
          }
        });
      }
    }
  });

  reader.on("end", function () {
    dataValue.readyStatus = "DESCONECTADO";
    globalEmitter.emit("dataSend", dataValue);
  });

  function sendCommand(command, size, protocol, disconnect = false) {
    // if (!protocol) {
    //   return;
    // }
    return new Promise((resolve) => {
      try {
        reader.transmit(command, size, 2, function (err, data) {
          if (err) {
            return resolve({
              hasError: true,
              data: err,
            });
          } else {
            if (String(data).startsWith("63")) {
              return resolve({
                hasError: true,
                data: data,
              });
            }
            const response = {
              hasError: false,
              data: data,
            };
            console.log("Protocol:", pcsc.SCARD_UNPOWER_CARD);
            if (disconnect) {
              reader.disconnect(this.SCARD_UNPOWER_CARD, function (err) {
                if (err) {
                  console.warn(err);
                }
              });
              // pcsc.close();
              // reader.close();
            }
            resolve(response);
          }
        });
      } catch (err) {
        reader.disconnect(this.SCARD_UNPOWER_CARD, function (err) {
          if (err) {
            console.warn(err);
          }
        });
        //pcsc.close();

        resolve({
          hasError: true,
          data: err,
        });
      }
    });
  }
});

pcsc.on("error", function (err) {
  if (err) {
    console.warn("PCSC ERROR", err.message);
  }
  dataValue.error = err.message;
  globalEmitter.emit("dataSend", dataValue);
});
