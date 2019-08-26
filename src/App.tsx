/*
 * Copyright (C) 2018 DANS - Data Archiving and Networked Services (info@dans.knaw.nl)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from "react"
import { Component, createRef } from "react"
import GraphiQL from "graphiql"
import GraphiQLExplorer from "graphiql-explorer"
import "graphiql/graphiql.css"
import "./App.css"
import { buildClientSchema, getIntrospectionQuery, GraphQLSchema } from "graphql"

interface AppState {
    schema?: GraphQLSchema
    schemaError?: string
    query?: string
    variables?: string
    operationName?: string
    explorerIsOpen: boolean
    doProfile: boolean

    backendURL: string
    username: string
    password: string
}

class App extends Component<{}, AppState> {
    constructor(props: any) {
        super(props)
        this.state = {
            schema: null,
            schemaError: undefined,
            query: undefined,
            variables: undefined,
            operationName: undefined,
            explorerIsOpen: true,
            doProfile: false,
            backendURL: localStorage.getItem(App.LS_BACKEND_URL) || "",
            username: localStorage.getItem(App.LS_USERNAME) || "",
            password: "",
        }
    }

    // localstorage keys
    static LS_USERNAME = "easy-graphiql:username"
    static LS_BACKEND_URL = "easy-graphiql:backend-url"

    _graphiql = createRef<GraphiQL>()

    private isBlank = str => (!str || /^\s*$/.test(str))

    graphQLFetcher: (graphQLParams: { query: string }) => Promise<any> = async (graphQLParams) => {
        const username = this.state.username
        const password = this.state.password
        const encoded = window.btoa(`${username}:${password}`)
        const auth = "Basic " + encoded

        if (this.isBlank(this.state.backendURL))
            return {}
        else {
            try {
                const response = await fetch(this.state.backendURL + (this.state.doProfile ? "?profile" : ""), {
                    method: "post",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": auth,
                    },
                    body: JSON.stringify(graphQLParams),
                    credentials: "include",
                })
                const responseBody = await response.text()
                return response.status === 200
                    ? this.parseResponse(responseBody)
                    : { error: responseBody }
            }
            catch (error) {
                console.error(error.toString())
                return { error: error.toString() }
            }
            finally {
                this.setProfiling(false)
            }
        }
    }

    parseResponse = (responseBody: string) => {
        const json = JSON.parse(responseBody)

        if (this.state.operationName !== "IntrospectionQuery" && this._graphiql.current && json.extensions) {
            if (json.extensions.metrics) {
                this._graphiql.current.getQueryEditor().setValue(json.extensions.metrics.query)
                delete json.extensions.metrics.query
            }
            else if (json.extensions.formattedQuery) {
                this._graphiql.current.getQueryEditor().setValue(json.extensions.formattedQuery)
                delete json.extensions
            }
        }

        return json
    }

    onProfile = () => {
        this.setProfiling(true)
        this._graphiql.current._runQueryAtCursor()
    }

    toggleExplorer = () => {
        this.setState(state => ({ ...state, explorerIsOpen: !state.explorerIsOpen }))
    }

    setProfiling = newValue => {
        this.setState(state => ({ ...state, doProfile: newValue }))
    }

    setSchema = newSchema => {
        this.setState(state => ({ ...state, schema: newSchema }))
    }

    setSchemaError = newSchemaError => {
        this.setState(state => ({ ...state, schemaError: newSchemaError }))
    }

    setQuery = newQuery => {
        this.setState(state => ({ ...state, query: newQuery }))
    }

    setVariable = newVariables => {
        this.setState(state => ({ ...state, variables: newVariables }))
    }

    setNewOperationName = newOperationName => {
        this.setState(state => ({ ...state, operationName: newOperationName }))
    }

    setUsername = e => {
        e.persist()
        const newUsername = e.target.value
        this.setState(state => ({ ...state, username: newUsername }))
        localStorage.setItem(App.LS_USERNAME, newUsername)
    }

    setPassword = e => {
        e.persist()
        this.setState(state => ({ ...state, password: e.target.value }))
    }

    setBackendURL = e => {
        e.persist()
        const newBackendUrl = e.target.value
        this.setState(state => ({ ...state, backendURL: newBackendUrl }))
        localStorage.setItem(App.LS_BACKEND_URL, newBackendUrl)
    }

    async fetchSchema() {
        const result = await this.graphQLFetcher({ query: getIntrospectionQuery() })
        if (result.data)
            this.setSchema(buildClientSchema(result.data))
        else if (result.error)
            this.setSchemaError(result.error)
    }

    async componentDidMount() {
        await this.fetchSchema()
    }

    render() {
        return (
            <>
                <div className="config">
                    <div className="config_elem">
                        <label htmlFor="username" className="title">Username</label>
                        <input type="text"
                               id="username"
                               placeholder="Username"
                               value={this.state.username}
                               onChange={this.setUsername}/>
                    </div>
                    <div className="config_elem">
                        <label htmlFor="password" className="title">Password</label>
                        <input type="password"
                               id="password"
                               placeholder="Password"
                               value={this.state.password}
                               onChange={this.setPassword}/>
                    </div>
                    <div className="config_elem">
                        <label htmlFor="backend_url" className="title">Server</label>
                        <input type="text"
                               id="backend_url"
                               className={this.state.schemaError ? "error" : ""}
                               placeholder="Backend URL"
                               value={this.state.backendURL}
                               onChange={this.setBackendURL}
                               onKeyPress={e => e.key === "Enter" && this.fetchSchema()}/>
                        <button type="button"
                                id="backend_url_button"
                                disabled={this.isBlank(this.state.backendURL)}
                                onClick={() => this.fetchSchema()}>Use
                        </button>
                        {this.state.schemaError && <span className="error_text">{this.state.schemaError}</span>}
                    </div>
                </div>
                <div className="graphiql-container"
                     style={{ height: `calc(100vh - ${this.state.schemaError ? 120 : 100}px)` }}>
                    <GraphiQLExplorer
                        schema={this.state.schema}
                        query={this.state.query}
                        onEdit={this.setQuery}
                        onRunOperation={() => this._graphiql.current.handleRunQuery()}
                        explorerIsOpen={this.state.explorerIsOpen}
                        onToggleExplorer={this.toggleExplorer}/>
                    <GraphiQL
                        ref={ref => (this._graphiql = ref)}
                        fetcher={this.graphQLFetcher}
                        schema={this.state.schema}
                        query={this.state.query}
                        variables={this.state.variables}
                        operationName={this.state.operationName}
                        onEditQuery={this.setQuery}
                        onEditVariables={this.setVariable}
                        onEditOperationName={this.setNewOperationName}>
                        <GraphiQL.Toolbar>
                            <GraphiQL.Button
                                onClick={() => this._graphiql.current.handlePrettifyQuery()}
                                label="Prettify"
                                title="Prettify Query (Shift-Ctrl-P)"/>
                            <GraphiQL.Button
                                onClick={() => this._graphiql.current.handleMergeQuery()}
                                label="Merge"
                                title="Merge Query (Shift-Ctrl-M)"/>
                            <GraphiQL.Button
                                onClick={() => this._graphiql.current.handleCopyQuery()}
                                label="Copy"
                                title="Copy Query (Shift-Ctrl-C)"/>
                            <GraphiQL.Button
                                onClick={() => this._graphiql.current.handleToggleHistory()}
                                label="History"
                                title="Show History"/>
                            <GraphiQL.Button
                                onClick={this.toggleExplorer}
                                label="Explorer"
                                title="Toggle Explorer"/>
                            <GraphiQL.Button
                                onClick={this.onProfile}
                                label="Profile"
                                title="Profile Query"/>
                        </GraphiQL.Toolbar>
                    </GraphiQL>
                </div>
            </>
        )
    }
}

export default App
