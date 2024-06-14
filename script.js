const cardsContainer = document.querySelector(".todo__list");
const form = document.querySelector(".form");
const input = document.querySelector(".form__input");
const button = document.querySelector(".form__button");
const textInfo = document.querySelector(".todo__text-info");
const cardTime = document.querySelector(".todo__save-time");
const cardDate = document.querySelector(".todo__save-date");

const title = document.querySelector(".todo__tittle");

// функция редактирования заголовка
function makeTitleEditable() {
  title.contentEditable = "true";
}
// функция сохранения заголовка
function saveTitle() {
  title.contentEditable = "false";
  localStorage.setItem("title", title.textContent);
}
// функция сохранения заголовка после перезагрузки страницы
function loadTitle() {
  const savedTitle = localStorage.getItem("title");
  if (savedTitle) {
    title.textContent = savedTitle;
  }
}

title.addEventListener("click", makeTitleEditable);
title.addEventListener("blur", saveTitle);
window.addEventListener("load", loadTitle);
title.textContent = "Список дел";

// уведомление

const alertPopupClose = document.querySelector(".todo__popup-alert-close");
const MS_PER_DAY = 1 * 60 * 60 * 1000;    // 24 - часа, 1 - час
const ALERT_DISPLAY_INTERVAL_DAYS = 1;
const ALERT_TIMESTAMP_KEY = 'lastAlertTimestamp';

// удаление уведомления на 1 день

const shouldShowAlert = () => {
  const lastAlertTimestamp = localStorage.getItem(ALERT_TIMESTAMP_KEY);
  if (!lastAlertTimestamp) return true;
  const daysSinceLastAlert = (new Date() - new Date(lastAlertTimestamp)) / MS_PER_DAY;
  return daysSinceLastAlert >= ALERT_DISPLAY_INTERVAL_DAYS;
}

const updateAlertTimestamp = () => {
  localStorage.setItem(ALERT_TIMESTAMP_KEY, new Date().toISOString());
};

const checkAndShowAlert = () => {
  if (shouldShowAlert()) {
    const alertPopup = document.querySelector(".todo__popup-alert");
    alertPopup.classList.add("todo__popup-alert_opened");
  }
};

alertPopupClose.addEventListener("click", () => {
  const alertPopup = document.querySelector(".todo__popup-alert");
  alertPopup.classList.remove("todo__popup-alert_opened");
  updateAlertTimestamp();
});

// уведомление если карточек нет

const cardTemplate = document
  .querySelector(".item-template")
  .content.querySelector(".todo__item");

function updateEmptyText() {
  textInfo.textContent = cardsContainer.hasChildNodes() ? "" : "Пустое поле";
}

// функция создания карточки

function createCard(text, time = getCurrentTime(), date = getCurrentDate()) {
  const card = cardTemplate.cloneNode(true);
  const cardText = card.querySelector(".todo__paragraph");
  const cardTime = card.querySelector(".todo__save-time");
  const cardDate = card.querySelector(".todo__save-date");

  cardText.textContent = text;
  cardTime.textContent = time;
  cardDate.textContent = date;
  addCardEventListeners(card);

  return card;
}

// функция отправки карточки

function submitForm(event) {
  event.preventDefault();
  if (!input.value.trim()) {
    return;
  }
  const newCard = createCard(input.value);
  cardsContainer.prepend(newCard);
  input.value = "";
  input.focus();
  updateEmptyText();
  saveCards();
}

// функция сохранения карточек

function saveCards() {
  const cards = [...cardsContainer.querySelectorAll(".todo__item")].map(
    (card) => ({
      text: card.querySelector(".todo__paragraph").textContent,
      time: card.querySelector(".todo__save-time").textContent,
      date: card.querySelector(".todo__save-date").textContent,
    }),
  );
  localStorage.setItem("cards", JSON.stringify(cards));
}

// функция загрузки карточек

function loadCards() {
  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  cards.forEach(({ text, time, date }) => {
    const card = createCard(text, time, date);
    cardsContainer.appendChild(card);
  });
  updateEmptyText();
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString();
}

function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString();
}

// функция редактирования карточки

function editCard(event) {
  const card = event.target.closest(".todo__item");
  const cardText = card.querySelector(".todo__paragraph");
  const cardTime = card.querySelector(".todo__save-time");
  const cardDate = card.querySelector(".todo__save-date");

  cardText.contentEditable = "true";
  cardText.dataset.editing = "true";
  cardText.focus();

  function closeFocusEditText() {
    cardText.contentEditable = "false";
    cardText.removeAttribute("data-editing");

    if (!cardText.textContent.trim()) {
      card.remove();
      updateEmptyText();
    } else {
      cardTime.textContent = getCurrentTime();
      cardDate.textContent = getCurrentDate();
    }
    saveCards();
    cardText.removeEventListener("blur", closeFocusEditText);
  }
  cardText.addEventListener("blur", closeFocusEditText);
}

// функция копировать карточку

function copyCard(event) {
  const copyCard = event.target.closest(".todo__item");
  const cloneCard = copyCard.cloneNode(true);

  cloneCard.querySelector(".todo__save-time").textContent = getCurrentTime();
  cloneCard.querySelector(".todo__save-date").textContent = getCurrentDate();

  addCardEventListeners(cloneCard);
  cardsContainer.insertBefore(cloneCard, copyCard.nextElementSibling);
  saveCards();
}

// функция удаления карточку

function deleteCard(event) {
  event.target.closest(".todo__item").remove();
  updateEmptyText();
  saveCards();
}

// общая функция кнопок

function addCardEventListeners(card) {
  // редактировать карточку
  card.querySelector(".edit").addEventListener("click", editCard);
  // копировать карточку
  card.querySelector(".copy").addEventListener("click", copyCard);
  // удалить карточку
  card.querySelector(".delete").addEventListener("click", deleteCard);
  // открыть попап
  card.querySelector(".todo__paragraph").addEventListener("click", (event) => {
    if (!event.target.dataset.editing) {
      openPopupCard(event.target);
    }
  });
}

// popup

const cardPopup = document.querySelector(".todo__popup");
const cardPopupText = document.querySelector(".todo__popup-text");
const cardPopupClose = document.querySelector(".todo__popup-close");
let currentCard;

function savePopupTextToCard() {
  if (currentCard) {
    const cardText = currentCard.querySelector(".todo__paragraph");
    const cardTime = currentCard.querySelector(".todo__save-time");
    const cardDate = currentCard.querySelector(".todo__save-date");

    const editedText = cardPopupText.textContent.trim();
    if (editedText !== "") {
      cardText.textContent = editedText;
      cardTime.textContent = getCurrentTime();
      cardDate.textContent = getCurrentDate();
      saveCards();
      updateEmptyText();
    } else {
      currentCard.remove();
      updateEmptyText();
      saveCards();
    }
  }
}

function openPopupCard(cardText) {
  currentCard = cardText.closest(".todo__item");
  cardPopupText.textContent = cardText.textContent;
  cardPopup.classList.add("todo__popup_opened");
}

function closePopupCard() {
  cardPopup.classList.remove("todo__popup_opened");
  savePopupTextToCard();
}

function closePopupOverlay(event) {
  if (event.target.classList.contains("todo__popup")) {
    closePopupCard();
  }
}

function editPopupText() {
  cardPopupText.contentEditable = "true";
  cardPopupText.focus();

  cardPopupText.addEventListener("blur", () => {
    cardPopupText.contentEditable = "false";
    savePopupTextToCard();
  });
}

cardPopupClose.addEventListener("click", closePopupCard);
cardPopup.addEventListener("click", closePopupOverlay);
cardPopupText.addEventListener("click", editPopupText);

form.addEventListener("submit", submitForm);

// вызов уведомления popup
checkAndShowAlert();

// загрузка карточек
loadCards();
