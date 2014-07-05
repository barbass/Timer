/** Плагин: Таймер от компании Etersoft
 * email: info@etersoft.ru
 * автор: barbass@etersoft.ru (vlad1010@inbox.ru)
 * дата: 2013-07-11
 */

function TIMER(options) {
	this.init(options);
}

TIMER.prototype = {
	defaultOptions: {
		//Стартовать сразу (1 - таймер запускается сразу, 0 - при вызове метода)
		start: 1,

		//Сохранять в storage данные (1 - да, 0 - нет) (пользователь предоставляет методы)
		save: 0,

		//Использовать последнее сохраненное время в storage (1 - да, 0 - нет)
		lastsave: 0,

		//Получать данные в формате чч:мм:сс (значение 1) или в секундах (значение 0)
		format: 1,

		//Ключ для сохранения в storage и взятие последнего сохраненного времени
		key: '',

		//Метод пользователя, который будет вызываться циклично
		usercycle: '',

		//Метод сохранения данных
		usersave: '',

		//Метод получения данных (миллисекунды)
		userget: 0,
	},
	options: {},

	//Время старта скрипта
	time_start: 0,

	//Номер потока
	time_out_id: 0,

	//Время нажатия паузы
	time_pause: 0,

	//Разница времени для паузы
	time_diff: 0,

	//Статус таймера (текстовое представление)
	status_timer_text: {
		'0': 'Not running',
		'1': 'Run',
		'10': 'Pause',
		'-1': 'Stop',
		'11': 'Reload',
	},
	//Статус таймера (0 - не запущен, 1 - запущен, 10 - пауза, -1 - сброшен, 11 - перезагрузка)
	status_timer: 0,

	/**
	 * Инициализация
	 * @param array options Опции
	 * @return bool
	 */
	init: function(options) {
		for(var option in this.defaultOptions) {
			this.options[option] = options && (options[option] !== undefined) ? options[option] : this.defaultOptions[option];
		};

		if (this.options['save'] === 1) {
			try {
				this.options['key'] = String(this.options['key']);
			} catch (e) {
				throw new Exception('User "Key" is not string');
				return false;
			}
		}

		if (this.options['lastsave'] === 1) {
			var time = this.getSavedTime();
			this.time_diff = (!isNaN(time) && time != 0) ? (-1)*time : 0;
		}

		if (this.options['start'] === 1) {
			this.startTimer();
		}
	},

	/**
	 * Получаем прошедшие секунды с учетом пауз и сохраненных данных
	 * @return float
	 */
	getPastSecond: function() {
		return this.getPastMilliSecond() / 1000;
	},

	/**
	 * Получаем прошедшие миллисекунды с учетом пауз и сохраненных данных
	 * @return float
	 */
	getPastMilliSecond: function() {
		var timeDiff = this.getNowTime() - this.time_start - this.time_diff;
		return timeDiff;
	},

	/**
	 * Запускаем самовызов таймера
	 * @return bool
	 */
	cycleTimer: function() {
		if (this.status_timer != 1) {
			return false;
		}

		var second = this.getPastSecond();

		//Сохраняем миллисекунды
		this.saveUserMethod(second*1000);

		//Передаем секунды
		this.callCycleUserMethod(second);

		var timer_object = this;
		this.time_out_id = window.setTimeout(function() {
			timer_object.cycleTimer();
		}, 1000);
	},

	/**
	 * Вызов пользовательской функции
	 * @param int
	 * @return bool
	 */
	callCycleUserMethod: function(second) {
		if (this.options['usercycle'] !== '') {
			if (this.options['format'] === 1) {
				var data = this.getFormatTime(second);
			} else {
				var data = second;
			}
			try {
				this.options['usercycle'](data);
			} catch (e) {
				throw new Exception('Error calling method "usercycle" ');
				return false;
			}
		}
		return true;
	},

	/**
	 * Парсинг времени в формат чч:мм:сс
	 * @param int
	 * @return string
	 */
	getFormatTime: function (second) {
		var minutes = Math.floor(second/60);
		var my_hours = Math.floor(minutes/60);
		var hours = Math.floor(minutes/60);

		var my_minutes = minutes - hours*60;
		var my_secs = parseInt(second - minutes*60);

		if (my_secs < 10) {
			my_secs = "0"+my_secs;
		}

		if (my_minutes < 10) {
			my_minutes = "0"+my_minutes;
		}
		if (my_hours < 10) {
			my_hours = "0"+my_hours;
		}

		return (my_hours + ":" + my_minutes + ":" + my_secs);
	},

	/**
	 * Запуск таймера
	 * если таймер был сброшен, то отсчет заново
	 * если таймер был на паузе, то продолжаем отсчет
	 */
	startTimer: function() {
		//При повторном нажатии на play ничего не делаем
		if (this.status_timer == 1) {
			return;
		//Если была нажата пауза
		} else if (this.status_timer == 10) {
			this.time_diff += (this.getNowTime() - this.time_pause);
			this.status_timer = 1;
			this.cycleTimer();
			return;
		}
		this.stopTimeout();

		this.time_start = this.getNowTime();

		this.status_timer = 1;
		this.cycleTimer();
	},

	/**
	 * Остановка таймера
	 */
	pauseTimer: function() {
		if (this.status_timer == 10) {
			return false;
		}
		this.status_timer = 10;
		this.stopTimeout();
		this.time_pause = this.getNowTime();
	},

	/**
	 * Сброс таймера
	 */
	stopTimer: function() {
		this.status_timer = -1;
		this.stopTimeout();

		this.time_start = this.getNowTime();
		this.time_diff = 0;

		this.saveUserMethod(0);

		this.callCycleUserMethod(this.getPastSecond());
	},

	/**
	 * Перезагрузить таймер, берет последнее сохраненное значение таймера (имеет значение только при работе с save)
	 **/
	reloadTimer: function() {
		this.status_timer = 11;
		this.stopTimeout();

		var time = this.getSavedTime();
		this.time_diff = (!isNaN(time) && time != 0) ? (-1)*time : 0;
		this.startTimer();
	},

	/**
	 * Останавливаем вызов функции
	 **/
	stopTimeout: function() {
		clearTimeout(this.time_out_id);
		this.time_out_id = 0;
	},

	/**
	 * Возвращаем текущее время
	 * @return int
	 */
	getNowTime: function() {
		return new Date().getTime();
	},

	/**
	 * Сохраняет в пользовательский метод
	 * @param int
	 */
	saveUserMethod: function(microsec) {
		try {
			if (this.options['save'] === 1 && this.options['key'] !== '') {
				this.options['usersave'](this.options['key'], microsec);
			}
		} catch (e) {
			throw new Exception('Error calling method "usersave" ');
		}
	},

	/**
	 * Получение сохраненного времени
	 */
	getSavedTime: function() {
		if (typeof(this.options['userget']) == 'function') {
			var data = this.options['userget'](this.options['key']);
		} else if (typeof(this.options['userget']) == 'object' || typeof(this.options['userget']) == 'number') {
			var data = this.options['userget'];
		} else {
			var data = 0;
		}

		try {
			data = parseInt(data);
			return data;
		} catch (e) {
			throw new Exception('"Key" value is not number');
			return false;
		}
	},

	/**
	 * Возвращаем текстовое представление статуса таймера
	 * @return string | bool
	 */
	getStatusTimerText: function() {
		try {
			return this.status_timer_text[this.status_timer];
		} catch (e) {
			throw new Exception("Timer status is not found ");
			return false;
		}
	},

	/**
	 * Возвращаем статус таймера
	 * @return int
	 */
	getStatusTimer: function() {
		return this.status_timer;
	},
}
