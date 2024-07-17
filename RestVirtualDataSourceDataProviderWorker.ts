import { AsyncVirtualDataSourceProviderWorker } from "igniteui-core/AsyncVirtualDataSourceProviderWorker";
import { SortDescriptionCollection } from "igniteui-core/SortDescriptionCollection";
import { FilterExpressionCollection } from "igniteui-core/FilterExpressionCollection";
import { AsyncVirtualDataSourceProviderTaskDataHolder } from "igniteui-core/AsyncVirtualDataSourceProviderTaskDataHolder";
import { RestVirtualDataSourceProviderTaskDataHolder } from "./RestVirtualDataSourceProviderTaskDataHolder";
import { RestVirtualDataSourceDataProviderWorkerSettings } from "./RestVirtualDataSourceDataProviderWorkerSettings";
import { SortDescription } from "igniteui-core/SortDescription";
import { ISectionInformation, ISectionInformation_$type } from "igniteui-core/ISectionInformation";
import { AsyncDataSourcePageTaskHolder } from "igniteui-core/AsyncDataSourcePageTaskHolder";
import { IDataSourceSchema } from "igniteui-core/IDataSourceSchema";
import { AsyncVirtualDataTask } from "igniteui-core/AsyncVirtualDataTask";
import { IDataSourceExecutionContext } from "igniteui-core/IDataSourceExecutionContext";
import { IDataSourcePage } from "igniteui-core/IDataSourcePage";
import { RestVirtualDataSourcePage } from "./RestVirtualDataSourcePage";
import { StringBuilder } from "igniteui-core/StringBuilder";
import { DefaultSectionInformation } from "igniteui-core/DefaultSectionInformation";
import { Convert } from "igniteui-core/Convert";
import { AsyncDataSourcePageRequest } from "igniteui-core/AsyncDataSourcePageRequest";
import { IFilterExpression } from "igniteui-core/IFilterExpression";
import { ODataDataSourceFilterExpressionVisitor } from "igniteui-core/ODataDataSourceFilterExpressionVisitor";
import { FilterExpressionVisitor } from "igniteui-core/FilterExpressionVisitor";
import { ListSortDirection } from "igniteui-core/ListSortDirection";
import { stringIsNullOrEmpty } from "igniteui-core/string";
import { SummaryDescriptionCollection } from 'igniteui-core/SummaryDescriptionCollection';
import { DataSourceSummaryOperand } from 'igniteui-core/DataSourceSummaryOperand';
import { DataSourceSummaryScope } from 'igniteui-core/DataSourceSummaryScope';
import { ISummaryResult } from 'igniteui-core/ISummaryResult';
import { DefaultSummaryResult } from 'igniteui-core/DefaultSummaryResult';
import { TransactionState } from 'igniteui-core/TransactionState';
import { TransactionType } from 'igniteui-core/TransactionType';
import { LocalDataSource } from 'igniteui-core/LocalDataSource';
import { DefaultDataSourceSchema } from 'igniteui-core/DefaultDataSourceSchema';

export class RestVirtualDataSourceDataProviderWorker extends AsyncVirtualDataSourceProviderWorker {
	private _baseUri: string = null;
	private _entitySet: string = null;
	private _sortDescriptions: SortDescriptionCollection = null;
	private _groupDescriptions: SortDescriptionCollection = null;
	private _filterExpressions: FilterExpressionCollection = null;
	private _summaryDescriptions: SummaryDescriptionCollection = null;
	private _summaryScope: DataSourceSummaryScope;	
	private _desiredPropeties: string[] = null;
	private _schemaIncludedProperties: Set<string> = null;
	private _enableJsonp: boolean = true;
	private _isAggregationSupported: boolean = false;
    private _provideFullCount: (page: any) => number = null;
    private _provideOrderByParameter: (args: any[], orderByString: string, orderBy: SortDescriptionCollection) => void = null;
    private _provideFilterParameter: (args: any[], filterString: string, filterExpressions: FilterExpressionCollection) => void = null;
    private _provideAggregationParameter: (args: any[], fetchCountOnly: boolean, groupByString: string, groupBy: SortDescriptionCollection, summaryString: string, summary: SummaryDescriptionCollection) => void = null;
	private _provideAggregatedCount: (item: any) => number = null;
    private _providePagingParameter: (args: any[], skip: number, take: number) => void = null;
    private _provideDesiredPropertiesParameter: (args: any[], selectString: string, desiredProperties: string[]) => void = null;
    private _provideItems: (result: any) => any[];
    private _provideUri: (baseUri: string, entitySet: string, args: { name: string, value: any }[]) => string = null;
    private _performFetch: (request: {
        requestUri: string,
        enableJsonpCallback: boolean,
        method: 'GET',
        headers: any,
        data: null
    }, 
    success: (data: any, response: any) => void,
    failure: (err: any) => void) => void = null;

    private _fixedFullCount: number = -1;

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
		let holder: RestVirtualDataSourceProviderTaskDataHolder = new RestVirtualDataSourceProviderTaskDataHolder();
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

	constructor(settings: RestVirtualDataSourceDataProviderWorkerSettings) {
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
		if (settings.schemaIncludedProperties != null) {
			this._schemaIncludedProperties = new Set<string>();
			for (let i = 0; i < settings.schemaIncludedProperties.length; i++) {
				this._schemaIncludedProperties.add(settings.schemaIncludedProperties[i]);
			}
		}
		this._summaryDescriptions = settings.summaryDescriptions;
        this._fixedFullCount = settings.fixedFullCount;
		this._summaryScope = settings.summaryScope;
		this._enableJsonp = settings.enableJsonp;
        this._provideFullCount = settings.provideFullCount;
        this._performFetch = settings.performFetch;
        this._provideAggregationParameter = settings.provideAggregationParameter;
        this._provideFilterParameter = settings.provideFilterParameter;
        this._provideOrderByParameter = settings.provideOrderByParameter;
        this._provideUri = settings.provideUri;
        this._providePagingParameter = settings.providePagingParameter;
        this._provideDesiredPropertiesParameter = settings.provideDesiredPropertiesParameter;
        this._provideItems = settings.provideItems;
		this._provideAggregatedCount = settings.provideAggregatedCount;

        if (!this._provideItems) {
            this._provideItems = (res) => {
                return res ? res.items : null;
            };
        }

        if (!this._provideFullCount) {
            this._provideFullCount = (p) => 
            {
                if (p.fullCount) {
                    return p.fullCount;
                } else {
                    return this._fixedFullCount >= 0 ? this._fixedFullCount : 0;
                }
            }
        }

        if (!this._provideOrderByParameter) {
            this._provideOrderByParameter = (args, orderByString, orderBy) => {
                args.push({ name: "orderBy", value: encodeURIComponent(orderByString)});
            };
        }

        if (!this._providePagingParameter) {
            this._providePagingParameter = (args, skip, take) => {
                args.push({ name: "skip", value: skip});
                args.push({ name: "take", value: take});
            };
        }

        if (!this._provideAggregationParameter) {
            this._provideAggregationParameter = (args, fetchCountOnly, groupByString, groupBy, summaryString, summary) => {
                args.push({ name: "groupBy", value: groupByString});
                args.push({ name: "aggregate", value: "count" });
            }
        }

        if (!this._provideUri) {
            this._provideUri = (baseUri, entitySet, args) => {
                let requestUri = baseUri;
                requestUri += "/" + entitySet;
                if (args.length > 0) {
                    requestUri += "?";
                }
                let argsString = "";
                for (var i = 0; i < args.length; i++) {
                    if (i > 0) {
                        argsString += "&";
                    }
                    argsString += args[i].name + "=" + args[i].value
                }

                return requestUri + argsString;
            };
        }

		this._isAggregationSupported = settings.isAggregationSupported;
		window.setTimeout(this.doWork, 100);
	}
	protected processCompletedTask(completedTask: AsyncDataSourcePageTaskHolder, currentDelay: number, pageIndex: number, taskDataHolder: AsyncVirtualDataSourceProviderTaskDataHolder): void {
		let h: RestVirtualDataSourceProviderTaskDataHolder = <RestVirtualDataSourceProviderTaskDataHolder>taskDataHolder;
		let schema: IDataSourceSchema = null;
		let result: any = null;
		let schemaFetchCount: number = -1;
		let task: AsyncVirtualDataTask = <AsyncVirtualDataTask>completedTask.task;
		try {
			if (task.hasErrors) {
				this.retryIndex(pageIndex, currentDelay);
				return;
			}
			if (pageIndex == RestVirtualDataSourceDataProviderWorker.schemaRequestIndex) {
				result = <any>task.result;
				schemaFetchCount = <number>(this._provideFullCount(result));
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
			this.actualCount = <number>(this._provideFullCount(result));
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
		let page: RestVirtualDataSourcePage = null;
		if (result != null) {
			page = new RestVirtualDataSourcePage(result, schema, groupInformation, summaryInformation, pageIndex);
			if (!this.isLastPage(pageIndex) && page.count() > 0 && !this.populatedActualPageSize) {
				this.populatedActualPageSize = true;
				this.actualPageSize = page.count();
			}
		} else {
			page = new RestVirtualDataSourcePage(null, schema, groupInformation, summaryInformation, pageIndex);
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
        if (this._provideAggregationParameter == null) {
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

        let args = [];
        if (this._provideOrderByParameter) {
            this._provideOrderByParameter(args, orderBy, this._groupDescriptions);
        }
        if (this._provideFilterParameter && filter != null) {
            this._provideFilterParameter(args, filter, this._filterExpressions);
        }
        if (this._provideAggregationParameter) {
            this._provideAggregationParameter(args, true, groupBy, this._groupDescriptions, summary, this._summaryDescriptions);
        }

        var uri = this._provideUri(this._baseUri, this._entitySet, args);

		
		try {
			let groupInformation: ISectionInformation[] = [];
			let success_: (arg1: any, arg2: any) => void = (data: any, response: any) => this.groupSuccess(data, response, finishAction, failureAction, groupInformation);
			let failure_: (arg1: any) => void = (err: any) => this.groupError(err, finishAction, failureAction, groupInformation);
			let run_: () => void = null;
			
			var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
			var request = {
				requestUri: uri,
				enableJsonpCallback: this._enableJsonp,
				method: 'GET',
				headers: headers,
				data: null
			};
			run_ = () => {
                this.fetchUri(request, success_, failure_);
			};
			run_();
		}
		catch (e) {
			failureAction();
		}
	}

    private fetchUri(request: any, success: (arg1: any, arg2: any) => void, failure: (arg1: any) => void) {
        if (this._performFetch) {
            this._performFetch(request, success, failure);
        } else {
            fetch(
            request.requestUri,
            {
                method: request.method,
                headers: request.headers,
                
            }
            ).then((res) => {
                res.json().then((j) => {
                    success(j, res);
                });
            }).catch((e) => {
                failure(e);
            })
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

        let items = this._provideItems(data);

		if (items && items.length > 0) {
			let currentIndex = 0;
			for (let i = 0; i < items.length; i++) {
				this.addGroup(groupInformation, groupNames, groupNames, currentIndex, items[i]);
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
        //todo: make this customizable
		if (this._provideAggregatedCount) {
			let ct = this._provideAggregatedCount(group);
		} else {
			if (group["aggregatedCount"]) {
				groupCount = Convert.toInt321(group["aggregatedCount"]);
			}
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
		
        let args = [];
        // if (this._provideOrderByParameter) {
        //     args.push({ name: "orderBy", value: this._provideOrderByParameter(orderBy, this._sortDescriptions) });
        // }
        if (this._provideFilterParameter && filter != null) {
            this._provideFilterParameter(args, filter, this._filterExpressions);
        }
        if (this._provideAggregationParameter) {
            this._provideAggregationParameter(args, true, null, null, summary, this._summaryDescriptions);
        }

        var uri = this._provideUri(this._baseUri, this._entitySet, args);
		// let commandText = this._entitySet + "?$apply=";
		// if (!stringIsNullOrEmpty(filter)) {
		// 	commandText += "filter(" + filter + ")/";
		// }
		// commandText += "aggregate(" + summary + ")";
		try {
			let summaryInformation: ISummaryResult[] = [];
			let success_: (arg1: any, arg2: any) => void = (data: any, response: any) => this.summarySuccess(data, response, finishAction, failureAction, summaryInformation);
			let failure_: (arg1: any) => void = (err: any) => this.summaryError(err, finishAction, failureAction, summaryInformation);
			let run_: () => void = null;
			
			var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
			var request = {
				requestUri: uri,
				enableJsonpCallback: this._enableJsonp,
				method: 'GET',
				headers: headers,
				data: null
			};
			run_ = () => {
				this.fetchUri(request, success_, failure_);
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
				if (summary.operand == DataSourceSummaryOperand.Count && (ignoreCount || countExists)) {
					continue;
				}

				if (!first) {
					result += ", ";
				}

				switch (summary.operand) {
					case DataSourceSummaryOperand.Average:
						result += summary.propertyName + " with average as " + summary.propertyName + "Average";
						break;
					case DataSourceSummaryOperand.Min:
						result += summary.propertyName + " with min as " + summary.propertyName + "Min";
						break;
					case DataSourceSummaryOperand.Max:
						result += summary.propertyName + " with max as " + summary.propertyName + "Max";
						break;
					case DataSourceSummaryOperand.Sum:
						result += summary.propertyName + " with sum as " + summary.propertyName + "Sum";
						break;
					case DataSourceSummaryOperand.Count:
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
				case DataSourceSummaryOperand.Average:
					summaryName += "Average";
					break;
				case DataSourceSummaryOperand.Min:
					summaryName += "Min";
					break;
				case DataSourceSummaryOperand.Max:
					summaryName += "Max";
					break;
				case DataSourceSummaryOperand.Sum:
					summaryName += "Sum";
					break;
				case DataSourceSummaryOperand.Count:
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
    private resolveSchemaFromItems(items: any[]) {
        let lds = new LocalDataSource();
        lds.dataSource = items;
        lds.flushAutoRefresh();
        return lds.actualSchema;
    }

	private resolveSchema(finishAction: (arg1: IDataSourceSchema) => void, failureAction: (e) => void): void {
        if (!this._provideItems || !this._providePagingParameter) {
            failureAction("required providers for items and paging are not specified");
            return;
        }

		let success_: (arg1: any) => void = (res: any) => {
            
            let items = this._provideItems(res);
            
			if (items && items.length > 0) {
                let schema = this.resolveSchemaFromItems(items);
				if (this._schemaIncludedProperties != null) {
					let propertyNames: any[] = [];
                	let propertyTypes: any[] = [];
					for (let i = 0; i < schema.propertyNames.length; i++) {
						if (!this._schemaIncludedProperties.has(schema.propertyNames[i])) {
							continue;
						}
						propertyNames.push(schema.propertyNames[i]);
						propertyTypes.push(schema.propertyTypes[i]);
					}
					schema = new DefaultDataSourceSchema(propertyNames, propertyTypes, schema.primaryKey, schema.propertyDataIntents);
				}
			    finishAction(schema);
            } else {
                failureAction("could not find items to resolve schema");
            }
		};
		let failure_: (e) => void = (e) => failureAction(e);
	
        let args = [];
        if (this._providePagingParameter) {
            this._providePagingParameter(args, 0, this.actualPageSize);
        }

        let uri = this._provideUri(this._baseUri, this._entitySet, args);
        try {
			let run_: () => void = null;
			
			var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
			var request = {
				requestUri: uri,
				enableJsonpCallback: this._enableJsonp,
				method: 'GET',
				headers: headers,
				data: null
			};
			run_ = () => {
				this.fetchUri(request, success_, failure_);
			};
			run_();
		}
		catch (e) {
			failureAction(e);
		}
	}
	private _filterString: string = null;
	private _selectedString: string = null;
	static readonly schemaRequestIndex: number = -1;
	protected makeTaskForRequest(request: AsyncDataSourcePageRequest, retryDelay: number): void {
        let args = [];
        
        // if (this._provideAggregationParameter) {
        //     args.push({ name: "apply", value: this._provideAggregationParameter(true, groupBy, this._groupDescriptions, summary, this._summaryDescriptions) });
        // }

		let actualPageSize: number = 0;
		let sortDescriptions: SortDescriptionCollection = null;
		actualPageSize = this.actualPageSize;
		sortDescriptions = this.sortDescriptions;
		//let requestUrl: string = this._baseUri;
		//requestUrl += "/" + this._entitySet;
		let queryStarted: boolean = false;
		this.updateFilterString();
		if (this._filterString != null) {
			if (this._provideFilterParameter) {
                this._provideFilterParameter(args, this._filterString, this._filterExpressions);
            }
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
				if (this._provideOrderByParameter) {
                    this._provideOrderByParameter(args, sortString, this._sortDescriptions);
                }        
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
			if (this._provideDesiredPropertiesParameter) {
                this._provideDesiredPropertiesParameter(args, selectString, this._desiredPropeties);
            }
		}

        if (this._providePagingParameter) {
            if (request.index == RestVirtualDataSourceDataProviderWorker.schemaRequestIndex) {
                this._providePagingParameter(args, 0, actualPageSize);
            } else {
                this._providePagingParameter(args, request.index * actualPageSize, actualPageSize);
            }
        }

		let task: AsyncVirtualDataTask = new AsyncVirtualDataTask();

        let uri = this._provideUri(this._baseUri, this._entitySet, args);

		if (request.index == RestVirtualDataSourceDataProviderWorker.schemaRequestIndex) {
			this.executeRequest(uri, queryStarted, 0, actualPageSize, task);
		} else {
			this.executeRequest(uri, queryStarted, request.index * actualPageSize, actualPageSize, task);
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
		// if (!queryStarted) {
		// 	queryStarted = true;
		// 	requestUrl += "?";
		// } else {
		// 	requestUrl += "&";
		// }
		// requestUrl += "$skip=" + skip + "&$top=" + top + "&$count=true";
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
		run_ = () => { this.fetchUri(
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
	createBatchRequest(changes: TransactionState[]) {
		//TODO: updates
	}
	private getRequestUriWithKey(key: any): string {
		let result = "";
		const keys = Object.keys(key);
		for (let i = 0; i < keys.length; i++) {
			if (i > 0) {
				result += ",";
			}
			result += `${keys[i]}=${key[keys[i]]}`;
		}
		return `${this._entitySet}(${result})`;
	}
}