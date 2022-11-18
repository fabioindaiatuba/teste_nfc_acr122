function setValue(field, value) {
  document.getElementById(field).textContent = value;
}

function addClass(field, value) {
  document.getElementById(field).classList.add(value);
}

function removeClass(field, value) {
  document.getElementById(field).classList.remove(value);
}

setValue("nameReader", "");

const myEmitter = require("../service/EventEmitter");
const globalEmitter = myEmitter.emitter;

globalEmitter.on("dataSend", function (msg) {
  const data = JSON.parse(msg.data);

  console.log(msg.data);
  if (data) {
    if (data.hasError) {
      removeClass("card", "bg-success");
      removeClass("card", "bg-error");
      setValue("nameReader", data.readyName);
      setValue("urlCompare", "ERRO: " + data.tagId);
      return;
    }

    if (!data.tagOnReader) {
      removeClass("card", "bg-success");
      removeClass("card", "bg-error");
    } else {
      if (data.dataTag && data.urlValid) {
        addClass("card", "bg-success");
      } else {
        addClass("card", "bg-error");
      }
    }
    setValue("nameReader", data.readyName);
    setValue("tagValue", data.tagId);
    setValue("urlCompare", "URL: " + data.urlCompare);
    setValue("compareValue", "TAG: " + data.dataTag);
  }
});
