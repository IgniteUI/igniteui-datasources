import { AsyncVirtualDataSourceProviderWorker } from "igniteui-core/AsyncVirtualDataSourceProviderWorker";
import { SortDescriptionCollection } from "igniteui-core/SortDescriptionCollection";
import { FilterExpressionCollection } from "igniteui-core/FilterExpressionCollection";
import { AsyncVirtualDataSourceProviderTaskDataHolder } from "igniteui-core/AsyncVirtualDataSourceProviderTaskDataHolder";
import { ODataVirtualDataSourceProviderTaskDataHolder } from "./ODataVirtualDataSourceProviderTaskDataHolder";
import { ODataVirtualDataSourceDataProviderWorkerSettings } from "./ODataVirtualDataSourceDataProviderWorkerSettings";
import { SortDescription } from "igniteui-core/SortDescription";
import { ISectionInformation, ISectionInformation_$type } from "igniteui-core/ISectionInformation";
import { AsyncDataSourcePageTaskHolder } from "igniteui-core/AsyncDataSourcePageTaskHolder";
import { IDataSourceSchema } from "igniteui-core/IDataSourceSchema";
import { AsyncVirtualDataTask } from "igniteui-core/AsyncVirtualDataTask";
import { IDataSourceExecutionContext } from "igniteui-core/IDataSourceExecutionContext";
import { IDataSourcePage } from "igniteui-core/IDataSourcePage";
import { ODataDataSourcePage } from "./ODataDataSourcePage";
import { StringBuilder } from "igniteui-core/StringBuilder";
import { DefaultSectionInformation } from "igniteui-core/DefaultSectionInformation";
import { Convert } from "igniteui-core/Convert";
import { ODataSchemaProvider } from "./ODataSchemaProvider";
import { AsyncDataSourcePageRequest } from "igniteui-core/AsyncDataSourcePageRequest";
import { IFilterExpression } from "igniteui-core/IFilterExpression";
import { ODataDataSourceFilterExpressionVisitor } from "igniteui-core/ODataDataSourceFilterExpressionVisitor";
import { FilterExpressionVisitor } from "igniteui-core/FilterExpressionVisitor";
import { ListSortDirection } from "igniteui-core/ListSortDirection";
import { stringIsNullOrEmpty } from "igniteui-core/string";
import { SummaryDescriptionCollection } from 'igniteui-core/SummaryDescriptionCollection';
import { SummaryOperand } from 'igniteui-core/SummaryOperand';
import { DataSourceSummaryScope } from 'igniteui-core/DataSourceSummaryScope';
import { ISummaryResult } from 'igniteui-core/ISummaryResult';
import { DefaultSummaryResult } from 'igniteui-core/DefaultSummaryResult';

declare let odatajs: any;

export class ODataVirtualDataSourceDataProviderWorker extends AsyncVirtualDataSourceProviderWorker {
	private _baseUri: string = null;
	private _entitySet: string = null;
	private _sortDescriptions: SortDescriptionCollection = null;
	private _groupDescriptions: SortDescriptionCollection = null;
	private _filterExpressions: FilterExpressionCollection = null;
	private _summaryDescriptions: SummaryDescriptionCollection = null;
	private _summaryScope: DataSourceSummaryScope;	
	private _desiredPropeties: string[] = null;
	private _enableJsonp: boolean = true;
	private _isAggregationSupported: boolean = false;
	protected get sortDescriptions(): SortDescriptionCollection {
		return this._sortDescriptions;
	}
	protected get filterExpressions(): FilterExpressionCollection {
		return this._filterExpressions;
	}
	protected get desiredProperties(): string[] {
		return this._desiredPropeties;
	}
	protected initialize(): void {
		super.initialize();
	}
	protected getTaskDataHolder(): AsyncVirtualDataSourceProviderTaskDataHolder {
		let holder: ODataVirtualDataSourceProviderTaskDataHolder = new ODataVirtualDataSourceProviderTaskDataHolder();
		return holder;
	}
	protected getCompletedTaskData(holder: AsyncVirtualDataSourceProviderTaskDataHolder, completed: number): void {
		super.getCompletedTaskData(holder, completed);
	}
	protected removeCompletedTaskData(holder: AsyncVirtualDataSourceProviderTaskDataHolder, completed: number): void {
		super.removeCompletedTaskData(holder, completed);
	}
	protected getTasksData(holder: AsyncVirtualDataSourceProviderTaskDataHolder): void {
		super.getTasksData(holder);
	}

	private *iter(coll: SortDescriptionCollection) {
		for (let i = 0; i < coll.size(); i++) {
			yield coll.get(i);
		}
	}
	private *iterFilter(coll: FilterExpressionCollection) {
		for (let i = 0; i < coll.size(); i++) {
			yield coll.get(i);
		}
	}
	private *iterSummaries(summaries: SummaryDescriptionCollection) {
		for (let i = 0; i < summaries.size(); i++) {
			yield summaries.get(i);
		}
	}

	constructor(settings: ODataVirtualDataSourceDataProviderWorkerSettings) {
		super(settings);
		this.doWork = this.doWork.bind(this);
		this._baseUri = settings.baseUri;
		this._entitySet = settings.entitySet;
		this._sortDescriptions = settings.sortDescriptions;
		this._groupDescriptions = settings.groupDescriptions;
		if (this._groupDescriptions != null && this._groupDescriptions.size() > 0) {
			this._sortDescriptions = new SortDescriptionCollection();
			for (let sd of this.iter(settings.sortDescriptions)) {
				this._sortDescriptions.add(sd);
			}
			for (let i = 0; i < this._groupDescriptions.size(); i++) {
				this._sortDescriptions.insert(i, this._groupDescriptions.get(i));
			}
		}
		this._filterExpressions = settings.filterExpressions;
		this._desiredPropeties = settings.propertiesRequested;
		this._summaryDescriptions = settings.summaryDescriptions;
		this._summaryScope = settings.summaryScope;
		this._enableJsonp = settings.enableJsonp;
		this._isAggregationSupported = settings.isAggregationSupported;
		window.setTimeout(this.doWork, 100);
	}
	protected processCompletedTask(completedTask: AsyncDataSourcePageTaskHolder, currentDelay: number, pageIndex: number, taskDataHolder: AsyncVirtualDataSourceProviderTaskDataHolder): void {
		let h: ODataVirtualDataSourceProviderTaskDataHolder = <ODataVirtualDataSourceProviderTaskDataHolder>taskDataHolder;
		let schema: IDataSourceSchema = null;
		let result: any = null;
		let schemaFetchCount: number = -1;
		let task: AsyncVirtualDataTask = <AsyncVirtualDataTask>completedTask.task;
		try {
			if (task.hasErrors) {
				this.retryIndex(pageIndex, currentDelay);
				return;
			}
			if (pageIndex == ODataVirtualDataSourceDataProviderWorker.schemaRequestIndex) {
				result = <any>task.result;
				schemaFetchCount = <number>(result['@odata.count']);
			} else {
				result = <any>task.result;
			}
		}
		catch (e) {
			this.retryIndex(pageIndex, currentDelay);
			return;
		}
		if (schemaFetchCount >= 0) {
			this.actualCount = schemaFetchCount;
		} else {
			this.actualCount = <number>(result['@odata.count']);
		}
		schema = this.actualSchema;
		if (schema == null) {
			let requests = 0;
			this.resolveSchema((s: IDataSourceSchema) => {
				// resolveSchema success callback
				this.actualSchema = s;

				if (this._isAggregationSupported && (this._groupDescriptions.size() !== 0 || this._summaryDescriptions.size() !== 0)) {
					if (this._groupDescriptions.size() > 0) {
						requests++;
						this.resolveGroupInformation((g: ISectionInformation[]) => {
							// group info success
							requests--;
							if (requests === 0) {
								this.finishProcessingCompletedTask(task, pageIndex, s, result);
							}
						}, () => {
							// group info failure
							this.retryIndex(pageIndex, currentDelay);
							return;
						});
					}
					if (this._summaryDescriptions.size() > 0) {
						requests++;
						this.resolveSummaryInformation((g: ISummaryResult[]) => {
							// summary info success
							requests--;
							if (requests === 0) {
								this.finishProcessingCompletedTask(task, pageIndex, s, result);
							}
						}, () => {
							// summary info failure
							this.retryIndex(pageIndex, currentDelay);
							return;
						})
					}
				} else {
					this.finishProcessingCompletedTask(task, pageIndex, s, result);
				}
			}, () => {
				// resolveSchema failure callback
				this.retryIndex(pageIndex, currentDelay);
				return;
			});
			return;
		}
		this.finishProcessingCompletedTask(task, pageIndex, schema, result);
	}
	private _groupInformation: ISectionInformation[] = null;
	private _summaryInformation: ISummaryResult[] = null;
	private finishProcessingCompletedTask(task: AsyncVirtualDataTask, pageIndex: number, schema: IDataSourceSchema, result: any): void {
		let executionContext: IDataSourceExecutionContext;
		let pageLoaded: (page: IDataSourcePage, currentFullCount: number, actualPageSize: number) => void;
		let groupInformation: ISectionInformation[];
		let summaryInformation: ISummaryResult[];
		this.actualSchema = schema;
		executionContext = this.executionContext;
		groupInformation = this._groupInformation;
		summaryInformation = this._summaryInformation;
		pageLoaded = this.pageLoaded;
		let page: ODataDataSourcePage = null;
		if (result != null) {
			page = new ODataDataSourcePage(result, schema, groupInformation, summaryInformation, pageIndex);
			if (!this.isLastPage(pageIndex) && page.count() > 0 && !this.populatedActualPageSize) {
				this.populatedActualPageSize = true;
				this.actualPageSize = page.count();
			}
		} else {
			page = new ODataDataSourcePage(null, schema, groupInformation, summaryInformation, pageIndex);
		}
		if (this.pageLoaded != null) {
			if (this.executionContext != null) {
				if (executionContext == null || pageLoaded == null) {
					this.shutdown();
					return;
				}
				executionContext.execute(() => pageLoaded(page, this.actualCount, this.actualPageSize));
			} else {
				if (pageLoaded == null) {
					this.shutdown();
					return;
				}
				pageLoaded(page, this.actualCount, this.actualPageSize);
			}
		}
	}
	private resolveGroupInformation(finishAction: (arg1: ISectionInformation[]) => void, failureAction: () => void): void {
		if (this._groupInformation != null) {
			finishAction(this._groupInformation);
			return;
		}
		let orderBy: string = "";
		let groupBy: string = "";
		let filter: string = null;
		let summary: string = "";
		if (this._groupDescriptions == null || this._groupDescriptions.size() == 0) {
			finishAction(null);
			return;
		}
		filter = this._filterString;
		this.updateFilterString();
		
		if (this._groupDescriptions != null) {
			let first1: boolean = true;
			for (let group of this.iter(this._groupDescriptions)) {
				if (first1) {
					first1 = false;
				} else {
					orderBy += ", ";
					groupBy += ", ";
				}

				groupBy += group.propertyName;

				if (group.direction === ListSortDirection.Descending) {
					orderBy += group.propertyName + " desc";
				} else {
					orderBy += group.propertyName + " asc";
				}
			}
		}

		if (this._summaryScope === DataSourceSummaryScope.Both || this._summaryScope === DataSourceSummaryScope.Groups) {
			let summaryParameters = this.getSummaryQueryParameters(true);
			if (!stringIsNullOrEmpty(summaryParameters)) {
				summary = ", " + summaryParameters;
			}
		}

		let commandText = this._entitySet + "?$orderby=" + orderBy + "&$apply=";
		if (!stringIsNullOrEmpty(filter)) {
			commandText += "filter(" + filter + ")/";
		}
		commandText += "groupby((" + groupBy + "), aggregate($count as $__count" + summary + "))";
		try {
			let groupInformation: ISectionInformation[] = [];
			let success_: (arg1: any, arg2: any) => void = (data: any, response: any) => this.groupSuccess(data, response, finishAction, failureAction, groupInformation);
			let failure_: (arg1: any) => void = (err: any) => this.groupError(err, finishAction, failureAction, groupInformation);
			let run_: () => void = null;
			
			var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
			var request = {
				requestUri: this._baseUri + "/" + commandText,
				enableJsonpCallback: this._enableJsonp,
				method: 'GET',
				headers: headers,
				data: null
			};
			run_ = function () {
				odatajs.oData.request(request, success_, failure_);
			};
			run_();
		}
		catch (e) {
			failureAction();
		}
	}
	private groupError(err: any, finishAction: (arg1: ISectionInformation[]) => void, failureAction: () => void, groupInformation: ISectionInformation[]): void {
		this._groupInformation = null;
	}
	private groupSuccess(data: any, response: any, finishAction: (arg1: ISectionInformation[]) => void, failureAction: () => void, groupInformation: ISectionInformation[]): void {
		let groupNames: string[] = [];
		for (let group of this.iter(this._groupDescriptions)) {
			groupNames.push(group.propertyName);
		}
		let groupNamesArray = groupNames;

		if (data && data.value && data.value.length > 0) {
			let currentIndex = 0;
			for (let i = 0; i < data.value.length; i++) {
				this.addGroup(groupInformation, groupNames, groupNames, currentIndex, data.value[i]);
			}
		}
		this._groupInformation = groupInformation;
		finishAction(this._groupInformation);
	}
	private addGroup(groupInformation: ISectionInformation[], groupNames: string[], groupNamesArray: string[], currentIndex: number, group: any): void {
		let groupValues: any[] = [];
		for (let name of groupNames) {
			if (group[name]) {
				groupValues.push(group[name]);
			}
		}
		let groupCount = 0;
		if (group["$__count"]) {
			groupCount = Convert.toInt321(group["$__count"]);
		}

		let summaryResults: ISummaryResult[] = null;
		if (this._summaryScope == DataSourceSummaryScope.Both || this._summaryScope == DataSourceSummaryScope.Groups) {
			summaryResults = this.createSummaryResults(group);
		}

		let groupInfo: DefaultSectionInformation = new DefaultSectionInformation(currentIndex, currentIndex + (groupCount - 1), groupNamesArray, groupValues, summaryResults);
		groupInformation.push(groupInfo);
	}
	private resolveSummaryInformation(finishAction: (arg1: ISummaryResult[]) => void, failureAction: () => void): void {
		if (this._summaryInformation != null) {
			finishAction(this._summaryInformation);
			return;
		}
		let filter: string = null;
		let summary: string = null;

		if (this._summaryDescriptions == null ||
			this._summaryDescriptions.size() == 0 ||
			this._summaryScope == DataSourceSummaryScope.Groups ||
			this._summaryScope == DataSourceSummaryScope.None) {
			finishAction(null);
			return;
		}

		filter = this._filterString;
		this.updateFilterString();
		
		summary = this.getSummaryQueryParameters(false);
		
		let commandText = this._entitySet + "?$apply=";
		if (!stringIsNullOrEmpty(filter)) {
			commandText += "filter(" + filter + ")/";
		}
		commandText += "aggregate(" + summary + ")";
		try {
			let summaryInformation: ISummaryResult[] = [];
			let success_: (arg1: any, arg2: any) => void = (data: any, response: any) => this.summarySuccess(data, response, finishAction, failureAction, summaryInformation);
			let failure_: (arg1: any) => void = (err: any) => this.summaryError(err, finishAction, failureAction, summaryInformation);
			let run_: () => void = null;
			
			var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
			var request = {
				requestUri: this._baseUri + "/" + commandText,
				enableJsonpCallback: this._enableJsonp,
				method: 'GET',
				headers: headers,
				data: null
			};
			run_ = function () {
				odatajs.oData.request(request, success_, failure_);
			};
			run_();
		}
		catch (e) {
			failureAction();
		}
	}
	private summarySuccess(data: any, response: any, finishAction: (arg1: ISummaryResult[]) => void, failureAction: () => void, summaryInformation: ISummaryResult[]): void {
		if (data && data.value && data.value.length > 0) {
			summaryInformation = this.createSummaryResults(data.value[0]);
		}

		this._summaryInformation = summaryInformation;
		finishAction(this._summaryInformation);
	}
	private summaryError(err: any, finishAction: (arg1: ISummaryResult[]) => void, failureAction: () => void, summaryInformation: ISummaryResult[]): void {
		this._summaryInformation = null;
	}
	private getSummaryQueryParameters(ignoreCount: boolean): string {
		let result = "";
		if (this._summaryDescriptions != null) {
			let first = true;
			let countExists = false;
			for (let summary of this.iterSummaries(this._summaryDescriptions)) {
				if (summary.operand == SummaryOperand.Count && (ignoreCount || countExists)) {
					continue;
				}

				if (!first) {
					result += ", ";
				}

				switch (summary.operand) {
					case SummaryOperand.Average:
						result += summary.propertyName + " with average as " + summary.propertyName + "Average";
						break;
					case SummaryOperand.Min:
						result += summary.propertyName + " with min as " + summary.propertyName + "Min";
						break;
					case SummaryOperand.Max:
						result += summary.propertyName + " with max as " + summary.propertyName + "Max";
						break;
					case SummaryOperand.Sum:
						result += summary.propertyName + " with sum as " + summary.propertyName + "Sum";
						break;
					case SummaryOperand.Count:
						result += "$count as $__count";
						countExists = true;
						break;
				}

				first = false;
			}
		}
		return result;
	}
	private createSummaryResults(data: any): ISummaryResult[] {
		let summaryResults: ISummaryResult[] = [];
		
		for (let summary of this.iterSummaries(this._summaryDescriptions)) {
			let summaryName = summary.propertyName;
			switch (summary.operand) {
				case SummaryOperand.Average:
					summaryName += "Average";
					break;
				case SummaryOperand.Min:
					summaryName += "Min";
					break;
				case SummaryOperand.Max:
					summaryName += "Max";
					break;
				case SummaryOperand.Sum:
					summaryName += "Sum";
					break;
				case SummaryOperand.Count:
					summaryName = "$__count";
					break;
			}

			let summaryValue = null;
			if (data && data[summaryName]) {
				summaryValue = data[summaryName];
			}

			let summaryResult = new DefaultSummaryResult(summary.propertyName, summary.operand, summaryValue);
			summaryResults.push(summaryResult);
		}

		return summaryResults;
	}
	private resolveSchema(finishAction: (arg1: IDataSourceSchema) => void, failureAction: () => void): void {
		let success_: (arg1: string) => void = (res: string) => {
			let sp: ODataSchemaProvider = new ODataSchemaProvider(res);
			let schema = sp.getODataDataSourceSchema(this._entitySet);
			finishAction(schema);
		};
		let failure_: () => void = () => failureAction();
		let baseUri_ = this._baseUri;
		var request = new XMLHttpRequest();
			request.onreadystatechange = function () {
				if (request.readyState === 4) {
					if (request.status === 200) {
						success_(request.responseText);
					} else {
						failure_();
					}
				}
			}

			request.open('Get', baseUri_ + '/$metadata');
			request.send();;
	}
	private _filterString: string = null;
	private _selectedString: string = null;
	static readonly schemaRequestIndex: number = -1;
	protected makeTaskForRequest(request: AsyncDataSourcePageRequest, retryDelay: number): void {
		let actualPageSize: number = 0;
		let sortDescriptions: SortDescriptionCollection = null;
		actualPageSize = this.actualPageSize;
		sortDescriptions = this.sortDescriptions;
		let requestUrl: string = this._baseUri;
		requestUrl += "/" + this._entitySet;
		let queryStarted: boolean = false;
		this.updateFilterString();
		if (this._filterString != null) {
			if (!queryStarted) {
				queryStarted = true;
				requestUrl += "?";
			} else {
				requestUrl += "&";
			}
			requestUrl += "$filter=" + this._filterString;
		}
		if (this.sortDescriptions != null) {
			let sortString: string = null;
			for (let sort of this.iter(this.sortDescriptions)) {
				if (sortString == null) {
					sortString = "";
				} else {
					sortString += ", ";
				}
				if (sort.direction == ListSortDirection.Descending) {
					sortString += sort.propertyName + " desc";
				} else {
					sortString += sort.propertyName;
				}
			}
			if (sortString != null) {
				if (!queryStarted) {
					queryStarted = true;
					requestUrl += "?";
				} else {
					requestUrl += "&";
				}
				requestUrl += "$orderby=" + sortString;
			}
		}
		if (this.desiredProperties != null && this.desiredProperties.length > 0) {
			let selectString: string = "";
			let first: boolean = true;
			let $t = this.desiredProperties;
			for (let i = 0; i < $t.length; i++) {
				let select = $t[i];
				if (first) {
					first = false;
				} else {
					selectString += ", ";
				}
				selectString += select;
			}
			if (!queryStarted) {
				queryStarted = true;
				requestUrl += "?";
			} else {
				requestUrl += "&";
			}
			requestUrl += "$select=" + selectString;
		}
		let task: AsyncVirtualDataTask = new AsyncVirtualDataTask();
		if (request.index == ODataVirtualDataSourceDataProviderWorker.schemaRequestIndex) {
			this.executeRequest(requestUrl, queryStarted, 0, actualPageSize, task);
		} else {
			this.executeRequest(requestUrl, queryStarted, request.index * actualPageSize, actualPageSize, task);
		}
		request.taskHolder = new AsyncDataSourcePageTaskHolder();
		(request.taskHolder as any).task = task;
		this.tasks.add(request);
	}
	private updateFilterString(): void {
		if (this.filterExpressions != null && this.filterExpressions.size() > 0 && this._filterString == null) {
			let sb: string = "";
			let first: boolean = true;
			for (let expr of this.iterFilter(this.filterExpressions)) {
				if (first) {
					first = false;
				} else {
					sb += " AND ";
				}
				let visitor: ODataDataSourceFilterExpressionVisitor = new ODataDataSourceFilterExpressionVisitor(0);
				visitor.visit(expr);
				let txt = visitor.toString();
				if (this.filterExpressions.size() > 1) {
					txt = "(" + txt + ")";
				}
				sb += (txt);
			}
			this._filterString = sb;
		}
	}
	private executeRequest(requestUrl: string, queryStarted: boolean, skip: number, top: number, task: AsyncVirtualDataTask): void {
		if (!queryStarted) {
			queryStarted = true;
			requestUrl += "?";
		} else {
			requestUrl += "&";
		}
		requestUrl += "$skip=" + skip + "&$top=" + top + "&$count=true";
		let requestUrl_ = requestUrl;
		let self_ = this;
		let success_: (arg1: any, arg2: any) => void = (data: any, response: any) => this.success(task, data, response);
		let failure_: (arg1: any) => void = (err: any) => this.error(task, err);
		let run_: () => void = null;
		
		var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
		var request = {
			requestUri: requestUrl_,
			enableJsonpCallback: this._enableJsonp,
			method: 'GET',
			headers: headers,
			data: null
		};
		run_ = function () { odatajs.oData.request(
			request,
			success_,
			failure_
		)};
		task.run = run_;
	}
	private success(t: AsyncVirtualDataTask, data: any, response: any): void {
		t.result = data;
		t.isCompleted = true;
	}
	private error(t: AsyncVirtualDataTask, result: any): void {
		t.isCompleted = true;
		t.hasErrors = true;
	}
}


