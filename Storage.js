/** Плагин: Таймер от компании Etersoft
 * email: info@etersoft.ru
 * автор: barbass@etersoft.ru (vlad1010@inbox.ru)
 * дата: 2013-07-11
 */

function STORAGE(options) {
	this.init(options);
}

STORAGE.prototype = {
	defaultOptions: {
		//Тип storage куда сохраняем по ключу время (session, local)
		type: 'session',
	},
	options: {},

	/**
	 * Инициализация
	 * @param array Опции
	 **/
	init: function(options) {
		for(var option in this.defaultOptions) {
			this.options[option] = options && (options[option] !== undefined) ? options[option] : this.defaultOptions[option];
		};
		if (this.options['type'] == 'session') {
			this.options['type'] = 'sessionStorage';
		} else if (this.options['type'] == 'local') {
			this.options['type'] = 'localStorage';
		} else {
			this.options['type'] = 'sessionStorage';
		}

		if (!window[this.options['type']]) {
			throw new Exception('Storage: Not support '+this.options['type']+' storage');
			return false;
		}
	},

	/**
	 * Получаем сохраненные данные в storage
	 * @param string
	 * @return bool | array | object
	 */
	getData: function(key) {
		try {
			var json = window[this.options['type']].getItem(key);
			if (json) {
				return JSON.parse(json);
			}
		} catch(e) {
			return false;
		}
		return false;
	},

	/**
	 * Сохраняем данные в storage
	 * @param string Ключ
	 * @param object Данные
	 * @return bool
	 */
	setData: function(key, data) {
		try {
			var json = JSON.stringify(data);
			window[this.options['type']].setItem(key, json);
		} catch(e) {
			return false;
		}
		return true;
	},

	/**
	 * Удаляем данные из storage
	 * @param string Ключ
	 * @return bool
	 */
	removeData: function(key) {
		try {
			return window[this.options['type']].removeItem(key);
		} catch(e) {
			//pass
		}
		return false;
	},

	/**
	 * Проверка существования ключа
	 * @param string Ключ
	 * @return bool
	 */
	checkStorage: function(key) {
		try {
			var data = window[this.options['storage_type']].getItem(key);
			return true;
		} catch(e) {
			return false;
		}
	},

	/**
	 * Количество данных в storage
	 * @return int | bool
	 */
	getLength: function() {
		try {
			return window[this.options['type']].length;
		} catch(e) {
			//pass
		}
		return false;
	},
}
